import { mapDbCorporateAccountToCorporateAccount } from "@/lib/corporate/mapper";
import { sessionHasPermission } from "@/lib/auth/permissions";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { ICorporateAccountRepository } from "@/repositories/corporate-account.repository";
import type { IGroupReservationRepository } from "@/repositories/group-reservation.repository";
import type { IInvoiceRepository } from "@/repositories/invoice.repository";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import { ActivityActionCodes } from "@/types/database/enums";
import type {
  CorporateAccount,
  CorporateAccountFormValues,
  CorporateAccountSearchFilters,
} from "@/types/corporate-account";

export interface ICorporateAccountService {
  createCompany(
    ctx: ServiceContext,
    session: AuthSession,
    values: CorporateAccountFormValues
  ): Promise<CorporateAccount>;
  updateCompany(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    values: CorporateAccountFormValues
  ): Promise<CorporateAccount>;
  archiveCompany(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<CorporateAccount>;
  find(ctx: ServiceContext, session: AuthSession, id: string): Promise<CorporateAccount | null>;
  search(
    ctx: ServiceContext,
    session: AuthSession,
    query: string
  ): Promise<CorporateAccount[]>;
  list(
    ctx: ServiceContext,
    session: AuthSession,
    filters?: CorporateAccountSearchFilters
  ): Promise<CorporateAccount[]>;
  getReservations(
    ctx: ServiceContext,
    session: AuthSession,
    corporateAccountId: string
  ): Promise<Awaited<ReturnType<IGroupReservationRepository["list"]>>>;
  getInvoices(
    ctx: ServiceContext,
    session: AuthSession,
    corporateAccountId: string
  ): Promise<Awaited<ReturnType<IInvoiceRepository["getAll"]>>>;
  getOutstandingBalance(
    ctx: ServiceContext,
    session: AuthSession,
    corporateAccountId: string
  ): Promise<number>;
  getPaymentHistory(
    ctx: ServiceContext,
    session: AuthSession,
    corporateAccountId: string
  ): Promise<Awaited<ReturnType<IPaymentRepository["getAll"]>>>;
}

export class CorporateAccountService implements ICorporateAccountService {
  constructor(
    private readonly corporateAccounts: ICorporateAccountRepository,
    private readonly groups: IGroupReservationRepository,
    private readonly invoices: IInvoiceRepository,
    private readonly payments: IPaymentRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  private require(session: AuthSession, action: "view" | "create" | "edit" | "manage"): void {
    if (!sessionHasPermission(session, "corporate_accounts", action)) {
      throw new ServiceError(
        `Forbidden: missing permission corporate_accounts.${action}`,
        "FORBIDDEN",
        403
      );
    }
  }

  private async log(
    ctx: ServiceContext,
    session: AuthSession,
    input: {
      action: string;
      actionCode: string;
      entityId: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.activityLogs.create({
      userId: ctx.userId,
      userName: session.fullName,
      action: input.action,
      actionCode: input.actionCode,
      module: "corporate_accounts",
      entityType: "corporate_account",
      entityId: input.entityId,
      metadata: input.metadata ?? {},
      status: "success",
    });
  }

  private mapForm(values: CorporateAccountFormValues) {
    if (!values.companyName.trim()) {
      throw new ServiceError("Company name is required.", "VALIDATION", 400);
    }
    return {
      company_name: values.companyName.trim(),
      billing_contact_name: values.billingContactName?.trim() || null,
      billing_contact_email: values.billingContactEmail?.trim() || null,
      billing_contact_phone: values.billingContactPhone?.trim() || null,
      billing_address: values.billingAddress?.trim() || null,
      credit_limit: values.creditLimit ?? null,
      credit_terms: values.creditTerms?.trim() || null,
      notes: values.notes?.trim() || null,
    };
  }

  async createCompany(
    ctx: ServiceContext,
    session: AuthSession,
    values: CorporateAccountFormValues
  ): Promise<CorporateAccount> {
    this.require(session, "create");
    const row = await this.corporateAccounts.create({
      ...this.mapForm(values),
      status: "active",
      created_by: ctx.userId,
    });
    await this.log(ctx, session, {
      action: `Corporate account created: ${row.company_name}`,
      actionCode: ActivityActionCodes.CORPORATE_CREATED,
      entityId: row.id,
      metadata: { account_number: row.account_number },
    });
    return mapDbCorporateAccountToCorporateAccount(row);
  }

  async updateCompany(
    ctx: ServiceContext,
    session: AuthSession,
    id: string,
    values: CorporateAccountFormValues
  ): Promise<CorporateAccount> {
    this.require(session, "edit");
    const row = await this.corporateAccounts.update(id, this.mapForm(values));
    await this.log(ctx, session, {
      action: `Corporate account updated: ${row.company_name}`,
      actionCode: ActivityActionCodes.CORPORATE_UPDATED,
      entityId: row.id,
    });
    return mapDbCorporateAccountToCorporateAccount(row);
  }

  async archiveCompany(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<CorporateAccount> {
    this.require(session, "manage");
    const row = await this.corporateAccounts.update(id, { status: "archived" });
    await this.log(ctx, session, {
      action: `Corporate account archived: ${row.company_name}`,
      actionCode: ActivityActionCodes.CORPORATE_ARCHIVED,
      entityId: row.id,
    });
    return mapDbCorporateAccountToCorporateAccount(row);
  }

  async find(
    ctx: ServiceContext,
    session: AuthSession,
    id: string
  ): Promise<CorporateAccount | null> {
    this.require(session, "view");
    const row = await this.corporateAccounts.getById(id);
    return row ? mapDbCorporateAccountToCorporateAccount(row) : null;
  }

  async search(
    ctx: ServiceContext,
    session: AuthSession,
    query: string
  ): Promise<CorporateAccount[]> {
    this.require(session, "view");
    const rows = await this.corporateAccounts.search(query);
    return rows.map(mapDbCorporateAccountToCorporateAccount);
  }

  async list(
    ctx: ServiceContext,
    session: AuthSession,
    filters?: CorporateAccountSearchFilters
  ): Promise<CorporateAccount[]> {
    this.require(session, "view");
    const rows = await this.corporateAccounts.list(filters);
    return rows.map(mapDbCorporateAccountToCorporateAccount);
  }

  async getReservations(
    _ctx: ServiceContext,
    session: AuthSession,
    corporateAccountId: string
  ) {
    this.require(session, "view");
    return this.groups.list({ corporateAccountId });
  }

  async getInvoices(
    _ctx: ServiceContext,
    session: AuthSession,
    corporateAccountId: string
  ) {
    this.require(session, "view");
    const groupRows = await this.groups.list({ corporateAccountId });
    const allInvoices = await this.invoices.getAll();
    const reservationIds = new Set<string>();
    for (const group of groupRows) {
      const reservations = await this.groups.listReservations(group.id);
      for (const reservation of reservations) {
        reservationIds.add(reservation.id);
      }
    }
    return allInvoices.filter(
      (invoice) => invoice.reservation_id && reservationIds.has(invoice.reservation_id)
    );
  }

  async getOutstandingBalance(
    _ctx: ServiceContext,
    session: AuthSession,
    corporateAccountId: string
  ): Promise<number> {
    this.require(session, "view");
    const groups = await this.groups.list({ corporateAccountId });
    let total = 0;
    for (const group of groups) {
      const reservations = await this.groups.listReservations(group.id);
      for (const reservation of reservations) {
        total += Number(reservation.balance ?? 0);
      }
    }
    return total;
  }

  async getPaymentHistory(
    _ctx: ServiceContext,
    session: AuthSession,
    corporateAccountId: string
  ) {
    this.require(session, "view");
    const groups = await this.groups.list({ corporateAccountId });
    const reservationIds = new Set<string>();
    for (const group of groups) {
      const reservations = await this.groups.listReservations(group.id);
      for (const reservation of reservations) {
        reservationIds.add(reservation.id);
      }
    }
    const payments = await this.payments.getAll();
    return payments.filter(
      (payment) => payment.reservation_id && reservationIds.has(payment.reservation_id)
    );
  }
}
