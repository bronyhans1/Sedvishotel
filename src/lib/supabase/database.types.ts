import type {
  DbActivityLog,
  DbGuest,
  DbHotelSettings,
  DbHousekeepingTask,
  DbInvoice,
  DbNightAudit,
  DbNotification,
  DbShiftHandover,
  DbShiftHandoverIssue,
  DbShiftHandoverTask,
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
  DbProductCategory,
  DbProduct,
  DbStockMovement,
  DbSale,
  DbSaleItem,
  DbSalePayment,
  DbGuestFolio,
  DbFolioEntry,
  DbCorporateAccount,
  DbGroupReservation,
  DbReservationBlock,
  DbGroupTimelineEvent,
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

type RoomsRelationships = [
  {
    foreignKeyName: "rooms_room_type_id_fkey";
    columns: ["room_type_id"];
    referencedRelation: "room_types";
    referencedColumns: ["id"];
  },
  {
    foreignKeyName: "rooms_floor_id_fkey";
    columns: ["floor_id"];
    referencedRelation: "floors";
    referencedColumns: ["id"];
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
      product_categories: TableRow<DbProductCategory>;
      products: TableRow<DbProduct>;
      stock_movements: TableRow<DbStockMovement>;
      sales: TableRow<DbSale>;
      sale_items: TableRow<DbSaleItem>;
      sale_payments: TableRow<DbSalePayment>;
      guest_folios: TableRow<DbGuestFolio>;
      folio_entries: TableRow<DbFolioEntry>;
      rooms: TableRow<DbRoom, RoomsRelationships>;
      guests: TableRow<DbGuest>;
      reservations: TableRow<DbReservation>;
      corporate_accounts: TableRow<DbCorporateAccount>;
      group_reservations: TableRow<DbGroupReservation>;
      reservation_blocks: TableRow<DbReservationBlock>;
      group_timeline_events: TableRow<DbGroupTimelineEvent>;
      reservation_guests: TableRow<DbReservationGuest>;
      payments: TableRow<DbPayment>;
      payment_transactions: TableRow<DbPaymentTransaction>;
      invoices: TableRow<DbInvoice>;
      housekeeping_tasks: TableRow<DbHousekeepingTask>;
      notifications: TableRow<DbNotification>;
      activity_logs: TableRow<DbActivityLog>;
      night_audits: TableRow<DbNightAudit>;
      shift_handovers: TableRow<DbShiftHandover>;
      shift_handover_tasks: TableRow<DbShiftHandoverTask>;
      shift_handover_issues: TableRow<DbShiftHandoverIssue>;
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
      next_product_identifier: {
        Args: Record<string, never>;
        Returns: number;
      };
      record_stock_movement: {
        Args: {
          p_product_id: string;
          p_movement_type: string;
          p_quantity: number;
          p_reference_type?: string | null;
          p_reference_id?: string | null;
          p_reason?: string | null;
          p_notes?: string | null;
          p_performed_by?: string | null;
          p_allow_negative?: boolean;
          p_allow_repeat_opening?: boolean;
        };
        Returns: DbStockMovement;
      };
      next_sale_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      next_pos_receipt_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      next_payment_receipt_locked: {
        Args: Record<string, never>;
        Returns: string;
      };
      next_invoice_number_locked: {
        Args: Record<string, never>;
        Returns: string;
      };
      shms_next_document_number: {
        Args: {
          p_kind: string;
        };
        Returns: string;
      };
      shms_peek_next_document_number: {
        Args: {
          p_kind: string;
        };
        Returns: string;
      };
      shms_get_document_sequence_state: {
        Args: {
          p_kind: string;
        };
        Returns: Record<string, unknown>;
      };
      shms_set_document_sequence: {
        Args: {
          p_kind: string;
          p_next_number: number;
        };
        Returns: Record<string, unknown>;
      };
      shms_format_document_number: {
        Args: {
          p_kind: string;
          p_sequence: number;
        };
        Returns: string;
      };
      shms_record_payment_receipt_print: {
        Args: {
          p_transaction_id: string;
          p_user_id: string;
        };
        Returns: Record<string, unknown>;
      };
      shms_record_pos_receipt_print: {
        Args: {
          p_sale_payment_id: string;
          p_user_id: string;
        };
        Returns: Record<string, unknown>;
      };
      next_folio_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      shms_commit_payment: {
        Args: {
          p_payload: Record<string, unknown>;
        };
        Returns: Record<string, unknown>;
      };
      shms_commit_payment_refund: {
        Args: {
          p_payload: Record<string, unknown>;
        };
        Returns: Record<string, unknown>;
      };
      shms_commit_pos_sale: {
        Args: {
          p_payload: Record<string, unknown>;
        };
        Returns: Record<string, unknown>;
      };
    };
    Enums: Record<string, never>;
  };
};
