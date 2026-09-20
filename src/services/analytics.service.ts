import { getAnalyticsAccess } from "@/lib/auth/analytics-access";
import {
  DASHBOARD_CORE_NEEDS,
  REPORTS_CORE_NEEDS,
  REVENUE_CORE_NEEDS,
  guestAnalyticsStub,
  invoiceStatusStub,
  resolveAnalyticsInvoiceStatus,
  type AnalyticsCoreDataNeeds,
} from "@/lib/analytics/core-data";
import { computeDashboardHomeData } from "@/lib/analytics/dashboard";
import { computeReportsData } from "@/lib/analytics/reports";
import { computeRevenueData } from "@/lib/analytics/revenue";
import { getCurrentBusinessDate } from "@/lib/dates/business-date";
import { getCalendarDateString } from "@/lib/dates/today";
import { getCurrentTimeString } from "@/lib/dates/time";
import { mapDbPaymentRowToPayment } from "@/lib/payments/mapper";
import { mapDbReservationToReservation } from "@/lib/reservations/mapper";
import { mapDbRoomToRoom } from "@/lib/rooms/mapper";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IGuestRepository } from "@/repositories/guest.repository";
import type { IInvoiceRepository } from "@/repositories/invoice.repository";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import type { DashboardHomeData } from "@/types/dashboard-home";
import type { Guest } from "@/types/guest";
import type { Invoice } from "@/types/invoice";
import type { Payment } from "@/types/payment";
import type { ReportsData } from "@/types/reports";
import type { Reservation } from "@/types/reservation";
import type { RevenueData } from "@/types/revenue";
import type { Room } from "@/types/room";

type AnalyticsCoreData = {
  payments: Payment[];
  invoices: Invoice[];
  reservations: Reservation[];
  rooms: Room[];
  guests: Guest[];
};

export interface IAnalyticsService {
  getRevenueData(ctx: ServiceContext, session: AuthSession): Promise<RevenueData>;
  getReportsData(ctx: ServiceContext, session: AuthSession): Promise<ReportsData>;
  getDashboardData(
    ctx: ServiceContext,
    session: AuthSession
  ): Promise<DashboardHomeData>;
}

export class AnalyticsService implements IAnalyticsService {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly invoices: IInvoiceRepository,
    private readonly reservations: IReservationRepository,
    private readonly rooms: IRoomRepository,
    private readonly guests: IGuestRepository,
    private readonly activityLogs: IActivityLogRepository
  ) {}

  /**
   * Consumer-scoped analytics load.
   * - Lean column selects (listForAnalytics / status rows)
   * - Skip unused tables per page (e.g. guests/invoices on dashboard)
   * - Skip payment timeline construction when not required
   *
   * KPI formulas and Business Date semantics are unchanged.
   * Lifetime aggregates still load all historical rows that those KPIs require.
   */
  private async loadCoreData(
    needs: AnalyticsCoreDataNeeds
  ): Promise<AnalyticsCoreData> {
    const paymentsPromise = needs.payments
      ? this.payments.listForAnalytics()
      : Promise.resolve([]);
    const invoicesPromise = needs.invoices
      ? this.invoices.listStatusRowsForAnalytics()
      : Promise.resolve([]);
    const reservationsPromise = needs.reservations
      ? this.reservations.listForAnalytics()
      : Promise.resolve([]);
    const roomsPromise = needs.rooms
      ? this.rooms.getAll(false)
      : Promise.resolve([]);
    const guestsPromise = needs.guests
      ? this.guests.listForAnalytics()
      : Promise.resolve([]);

    const [paymentItems, invoiceRows, reservationRows, roomRows, guestRows] =
      await Promise.all([
        paymentsPromise,
        invoicesPromise,
        reservationsPromise,
        roomsPromise,
        guestsPromise,
      ]);

    let payments: Payment[] = [];
    if (needs.payments) {
      const txByPayment = await this.payments.getTransactionsForIds(
        paymentItems.map((item) => item.payment.id)
      );
      payments = paymentItems.map((item) =>
        mapDbPaymentRowToPayment(
          item.payment,
          {
            guestName: item.guestName,
            reservationNumber: item.reservationNumber,
            roomNumber: item.roomNumber,
          },
          txByPayment.get(item.payment.id) ?? [],
          { includeTimeline: needs.paymentTimelines }
        )
      );
    }

    const invoices: Invoice[] = needs.invoices
      ? invoiceRows.map((row) =>
          invoiceStatusStub(
            resolveAnalyticsInvoiceStatus(
              row.balance,
              row.amount_paid,
              row.status
            )
          )
        )
      : [];

    const reservations: Reservation[] = needs.reservations
      ? reservationRows.map(mapDbReservationToReservation)
      : [];

    const rooms: Room[] = needs.rooms ? roomRows.map(mapDbRoomToRoom) : [];

    const guests: Guest[] = needs.guests
      ? guestRows.map((row) =>
          guestAnalyticsStub({
            id: row.id,
            totalVisits: row.total_visits,
            vipStatus: row.vip_status,
          })
        )
      : [];

    return { payments, invoices, reservations, rooms, guests };
  }

  async getRevenueData(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<RevenueData> {
    if (!getAnalyticsAccess(session).canViewRevenue) {
      throw new ServiceError(
        "Forbidden: revenue.view required.",
        "FORBIDDEN",
        403
      );
    }

    const data = await this.loadCoreData(REVENUE_CORE_NEEDS);
    const businessDate = await getCurrentBusinessDate();
    return computeRevenueData({
      ...data,
      asOfDate: businessDate,
    });
  }

  async getReportsData(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<ReportsData> {
    if (!getAnalyticsAccess(session).canViewReports) {
      throw new ServiceError(
        "Forbidden: reports.view required.",
        "FORBIDDEN",
        403
      );
    }

    const data = await this.loadCoreData(REPORTS_CORE_NEEDS);
    const [businessDate, policy] = await Promise.all([
      getCurrentBusinessDate(),
      loadCheckoutPolicy(),
    ]);

    let overstayCharges: import("@/types/overstay").OverstayCharge[] = [];
    try {
      const { getOverstayService } = await import(
        "@/lib/overstay/get-overstay-service"
      );
      const overstayService = await getOverstayService();
      overstayCharges = await overstayService.listAllCharges();
    } catch {
      overstayCharges = [];
    }

    return computeReportsData({
      ...data,
      asOfDate: businessDate,
      policyCheckOutTime: policy.checkOutTime,
      currentTime: getCurrentTimeString(),
      overstayCharges,
    });
  }

  async getDashboardData(
    _ctx: ServiceContext,
    session: AuthSession
  ): Promise<DashboardHomeData> {
    const access = getAnalyticsAccess(session);
    if (!access.canViewDashboard) {
      throw new ServiceError(
        "Forbidden: dashboard.view required.",
        "FORBIDDEN",
        403
      );
    }

    const [core, activityLogs, businessDate, policy] = await Promise.all([
      this.loadCoreData(DASHBOARD_CORE_NEEDS),
      this.activityLogs.findRecent(8),
      getCurrentBusinessDate(),
      loadCheckoutPolicy(),
    ]);

    return computeDashboardHomeData({
      ...core,
      activityLogs,
      showFinancials: access.showFinancials,
      asOfDate: businessDate,
      calendarDate: getCalendarDateString(),
      policyCheckOutTime: policy.checkOutTime,
      currentTime: getCurrentTimeString(),
    });
  }
}
