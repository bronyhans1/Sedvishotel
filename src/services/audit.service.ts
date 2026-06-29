import { getAuditAccess } from "@/lib/auth/audit-access";
import { computeAuditDashboardData } from "@/lib/audit/compute-audit";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IInvoiceRepository } from "@/repositories/invoice.repository";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { IUserRepository } from "@/repositories/user.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import type { AuditDashboardData } from "@/types/audit";

export interface IAuditService {
  getDashboardData(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<AuditDashboardData>;
}

export class AuditService implements IAuditService {
  constructor(
    private readonly activityLogs: IActivityLogRepository,
    private readonly reservations: IReservationRepository,
    private readonly payments: IPaymentRepository,
    private readonly invoices: IInvoiceRepository,
    private readonly rooms: IRoomRepository,
    private readonly users: IUserRepository
  ) {}

  private requireView(session: AuthSession): void {
    if (!getAuditAccess(session).canView) {
      throw new ServiceError("Forbidden: audit.view required.", "FORBIDDEN", 403);
    }
  }

  async getDashboardData(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<AuditDashboardData> {
    this.requireView(session);
    return computeAuditDashboardData({
      activityLogs: this.activityLogs,
      reservations: this.reservations,
      payments: this.payments,
      invoices: this.invoices,
      rooms: this.rooms,
      users: this.users,
    });
  }
}
