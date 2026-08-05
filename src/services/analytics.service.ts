import { getAnalyticsAccess } from "@/lib/auth/analytics-access";
import { computeDashboardHomeData } from "@/lib/analytics/dashboard";
import { computeReportsData } from "@/lib/analytics/reports";
import { computeRevenueData } from "@/lib/analytics/revenue";
import { getCurrentBusinessDate } from "@/lib/dates/business-date";
import { getCalendarDateString } from "@/lib/dates/today";
import { getCurrentTimeString } from "@/lib/dates/time";
import { loadCheckoutPolicy } from "@/lib/settings/checkout-policy";
import type { IActivityLogRepository } from "@/repositories/activity-log.repository";
import type { IGuestRepository } from "@/repositories/guest.repository";
import type { IInvoiceRepository } from "@/repositories/invoice.repository";
import type { IPaymentRepository } from "@/repositories/payment.repository";
import type { IReservationRepository } from "@/repositories/reservation.repository";
import type { IRoomRepository } from "@/repositories/room.repository";
import { mapDbGuestToGuest } from "@/lib/guests/mapper";
import { mapDbInvoiceToInvoice } from "@/lib/invoices/mapper";
import { mapDbPaymentToPayment } from "@/lib/payments/mapper";
import { mapDbReservationToReservation } from "@/lib/reservations/mapper";
import { mapDbRoomToRoom } from "@/lib/rooms/mapper";
import type { AuthSession } from "@/services/auth.service";
import { ServiceError } from "@/services/types";
import type { ServiceContext } from "@/services/types";
import type { DashboardHomeData } from "@/types/dashboard-home";
import type { ReportsData } from "@/types/reports";
import type { RevenueData } from "@/types/revenue";

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

  private async loadCoreData() {
    const [paymentRows, invoiceRows, reservationRows, roomRows, guestRows] =
      await Promise.all([
        this.payments.getAll(),
        this.invoices.getAll(),
        this.reservations.getAll(),
        this.rooms.getAll(false),
        this.guests.getAll(false),
      ]);

    const txByPayment = await this.payments.getTransactionsForIds(
      paymentRows.map((row) => row.id)
    );
    const payments = paymentRows.map((row) =>
      mapDbPaymentToPayment(row, txByPayment.get(row.id) ?? [])
    );

    const invoices = invoiceRows.map(mapDbInvoiceToInvoice);
    const reservations = reservationRows.map(mapDbReservationToReservation);
    const rooms = roomRows.map(mapDbRoomToRoom);
    const guests = guestRows.map(mapDbGuestToGuest);

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

    const data = await this.loadCoreData();
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

    const data = await this.loadCoreData();
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
      this.loadCoreData(),
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
