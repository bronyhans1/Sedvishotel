import type {
  DbActivityLog,
  DbGuest,
  DbHotelSettings,
  DbHousekeepingTask,
  DbInvoice,
  DbNightAudit,
  DbNotification,
  DbShiftHandover,
  DbPayment,
  DbPaymentTransaction,
  DbPermission,
  DbPublicBookingRequest,
  DbReservation,
  DbReservationGuest,
  DbRole,
  DbRolePermission,
  DbRoom,
  DbRoomPhoto,
  DbRoomType,
  DbFloor,
  DbStaffProfile,
  DbUser,
} from "@/types/database";

type TableRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type TableRow<T, R extends TableRelationship[] = []> = {
  Row: T & Record<string, unknown>;
  Insert: Partial<T> & Record<string, unknown>;
  Update: Partial<T> & Record<string, unknown>;
  Relationships: R;
};

type StaffProfileRelationships = [
  {
    foreignKeyName: "staff_profiles_user_id_fkey";
    columns: ["user_id"];
    isOneToOne: true;
    referencedRelation: "users";
    referencedColumns: ["id"];
  },
  {
    foreignKeyName: "staff_profiles_role_id_fkey";
    columns: ["role_id"];
    referencedRelation: "roles";
    referencedColumns: ["id"];
  },
];

type RolePermissionRelationships = [
  {
    foreignKeyName: "role_permissions_role_id_fkey";
    columns: ["role_id"];
    referencedRelation: "roles";
    referencedColumns: ["id"];
  },
  {
    foreignKeyName: "role_permissions_permission_id_fkey";
    columns: ["permission_id"];
    referencedRelation: "permissions";
    referencedColumns: ["id"];
  },
];

type UsersInverseRelationships = [
  {
    foreignKeyName: "staff_profiles_user_id_fkey";
    columns: ["id"];
    isOneToOne: true;
    referencedRelation: "staff_profiles";
    referencedColumns: ["user_id"];
  },
];

type RolesInverseRelationships = [
  {
    foreignKeyName: "staff_profiles_role_id_fkey";
    columns: ["id"];
    referencedRelation: "staff_profiles";
    referencedColumns: ["role_id"];
  },
  {
    foreignKeyName: "role_permissions_role_id_fkey";
    columns: ["id"];
    referencedRelation: "role_permissions";
    referencedColumns: ["role_id"];
  },
];

const RoomsRelationships = [
  {
    foreignKeyName: "rooms_room_type_id_fkey",
    columns: ["room_type_id"],
    referencedRelation: "room_types",
    referencedColumns: ["id"],
  },
  {
    foreignKeyName: "rooms_floor_id_fkey",
    columns: ["floor_id"],
    referencedRelation: "floors",
    referencedColumns: ["id"],
  },
];

type PermissionsInverseRelationships = [
  {
    foreignKeyName: "role_permissions_permission_id_fkey";
    columns: ["id"];
    referencedRelation: "role_permissions";
    referencedColumns: ["permission_id"];
  },
];

/**
 * Supabase client schema — hand-maintained until `supabase gen types` is wired in CI.
 */
export type Database = {
  public: {
    Tables: {
      roles: TableRow<DbRole, RolesInverseRelationships>;
      permissions: TableRow<DbPermission, PermissionsInverseRelationships>;
      role_permissions: TableRow<DbRolePermission, RolePermissionRelationships>;
      users: TableRow<DbUser, UsersInverseRelationships>;
      staff_profiles: TableRow<DbStaffProfile, StaffProfileRelationships>;
      room_types: TableRow<DbRoomType>;
      floors: TableRow<DbFloor>;
      rooms: TableRow<DbRoom, typeof RoomsRelationships>;
      guests: TableRow<DbGuest>;
      reservations: TableRow<DbReservation>;
      reservation_guests: TableRow<DbReservationGuest>;
      payments: TableRow<DbPayment>;
      payment_transactions: TableRow<DbPaymentTransaction>;
      invoices: TableRow<DbInvoice>;
      housekeeping_tasks: TableRow<DbHousekeepingTask>;
      notifications: TableRow<DbNotification>;
      activity_logs: TableRow<DbActivityLog>;
      night_audits: TableRow<DbNightAudit>;
      shift_handovers: TableRow<DbShiftHandover>;
      hotel_settings: TableRow<DbHotelSettings>;
      public_booking_requests: TableRow<DbPublicBookingRequest>;
      room_photos: TableRow<DbRoomPhoto>;
    };
    Views: Record<string, never>;
    Functions: {
      has_permission: {
        Args: {
          p_module: string;
          p_action: string;
        };
        Returns: boolean;
      };
      current_staff_role: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
};
