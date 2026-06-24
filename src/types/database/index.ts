export * from "@/types/database/enums";
export * from "@/types/database/tables";

/** Supabase Database generic placeholder — replace with generated types later */
export interface Database {
  public: {
    Tables: {
      roles: { Row: import("@/types/database/tables").DbRole };
      permissions: { Row: import("@/types/database/tables").DbPermission };
      role_permissions: { Row: import("@/types/database/tables").DbRolePermission };
      users: { Row: import("@/types/database/tables").DbUser };
      staff_profiles: { Row: import("@/types/database/tables").DbStaffProfile };
      room_types: { Row: import("@/types/database/tables").DbRoomType };
      floors: { Row: import("@/types/database/tables").DbFloor };
      rooms: { Row: import("@/types/database/tables").DbRoom };
      guests: { Row: import("@/types/database/tables").DbGuest };
      reservations: { Row: import("@/types/database/tables").DbReservation };
      reservation_guests: { Row: import("@/types/database/tables").DbReservationGuest };
      payments: { Row: import("@/types/database/tables").DbPayment };
      payment_transactions: { Row: import("@/types/database/tables").DbPaymentTransaction };
      invoices: { Row: import("@/types/database/tables").DbInvoice };
      housekeeping_tasks: { Row: import("@/types/database/tables").DbHousekeepingTask };
      notifications: { Row: import("@/types/database/tables").DbNotification };
      activity_logs: { Row: import("@/types/database/tables").DbActivityLog };
      night_audits: { Row: import("@/types/database/tables").DbNightAudit };
      shift_handovers: { Row: import("@/types/database/tables").DbShiftHandover };
      hotel_settings: { Row: import("@/types/database/tables").DbHotelSettings };
      public_booking_requests: {
        Row: import("@/types/database/tables").DbPublicBookingRequest;
      };
      room_photos: {
        Row: import("@/types/database/tables").DbRoomPhoto;
        Insert: Omit<
          import("@/types/database/tables").DbRoomPhoto,
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<
            import("@/types/database/tables").DbRoomPhoto,
            "id" | "created_at" | "updated_at"
          >
        >;
      };
    };
  };
}
