import type {
  DbActivityLogStatus,
  DbBookingRequestStatus,
  DbBookingSource,
  DbFloorId,
  DbGuestStatus,
  DbHousekeepingStatus,
  DbIdType,
  DbInvoiceStatus,
  DbNightAuditStatus,
  DbShiftHandoverStatus,
  DbShiftType,
  DbNotificationPriority,
  DbNotificationType,
  DbPaymentMethod,
  DbPaymentStatus,
  DbPermissionAction,
  DbPermissionModule,
  DbReservationGuestRole,
  DbReservationStatus,
  DbRoleId,
  DbRoomStatus,
  DbRoomTypeStatus,
  DbUserStatus,
} from "@/types/database/enums";

/** ISO timestamp strings from Postgres timestamptz */
type Timestamp = string;
type DateString = string;

export interface DbRole {
  id: DbRoleId;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbPermission {
  id: string;
  module: DbPermissionModule;
  action: DbPermissionAction;
  code: string;
  description: string | null;
  created_at: Timestamp;
}

export interface DbRolePermission {
  role_id: DbRoleId;
  permission_id: string;
  granted: boolean;
  created_at: Timestamp;
}

export interface DbUser {
  id: string;
  email: string;
  full_name: string;
  status: DbUserStatus;
  must_change_password: boolean;
  last_login_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbStaffProfile {
  id: string;
  user_id: string;
  role_id: DbRoleId;
  department: string | null;
  phone: string | null;
  employee_id: string | null;
  hire_date: DateString | null;
  notes: string | null;
  avatar_url: string | null;
  address: string | null;
  emergency_contact: string | null;
  next_of_kin: string | null;
  nationality: string | null;
  id_number: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbRoomType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  default_price: number;
  capacity: number;
  amenities: string[];
  status: DbRoomTypeStatus;
  sort_order: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbFloor {
  id: string;
  name: string;
  display_order: number;
  description: string | null;
  active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbRoom {
  id: string;
  room_number: string;
  floor: DbFloorId | null;
  floor_id: string;
  room_type_id: string;
  status: DbRoomStatus;
  notes: string | null;
  image_urls: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbGuest {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  id_type: DbIdType | null;
  id_number: string | null;
  address: string | null;
  guest_status: DbGuestStatus;
  vip_status: boolean;
  total_visits: number;
  total_spent: number;
  notes: string[];
  document_urls: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbReservation {
  id: string;
  reservation_number: string;
  guest_id: string;
  room_id: string;
  room_type_id: string;
  check_in_date: DateString;
  check_out_date: DateString;
  adults: number;
  children: number;
  status: DbReservationStatus;
  booking_source: DbBookingSource;
  room_rate: number;
  number_of_nights: number;
  subtotal: number;
  taxes: number;
  service_charge: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  special_requests: string | null;
  internal_notes: string | null;
  created_by: string | null;
  cancelled_at: Timestamp | null;
  checked_in_at: Timestamp | null;
  checked_out_at: Timestamp | null;
  original_check_out_date: DateString | null;
  actual_check_out_date: DateString | null;
  early_checkout_reason: string | null;
  early_checkout_notes: string | null;
  early_checkout_refund_amount: number | null;
  late_checkout_fee: number | null;
  late_checkout_reason: string | null;
  late_checkout_notes: string | null;
  late_checkout_at: Timestamp | null;
  late_checkout_complimentary: boolean;
  late_checkout_hours_late: number | null;
  late_checkout_policy_type: string | null;
  stay_extension_history: unknown;
  room_move_history: unknown;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbReservationGuest {
  id: string;
  reservation_id: string;
  guest_id: string;
  role: DbReservationGuestRole;
  created_at: Timestamp;
}

export interface DbPayment {
  id: string;
  reference: string;
  reservation_id: string;
  guest_id: string;
  method: DbPaymentMethod;
  amount: number;
  total_due: number;
  balance_after: number;
  status: DbPaymentStatus;
  payment_date: Timestamp;
  notes: string | null;
  recorded_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbPaymentTransaction {
  id: string;
  payment_id: string;
  description: string;
  amount: number;
  method: DbPaymentMethod;
  receipt_number: string | null;
  transacted_at: Timestamp;
  created_at: Timestamp;
}

export interface DbInvoice {
  id: string;
  invoice_number: string;
  reservation_id: string;
  guest_id: string;
  invoice_date: DateString;
  check_in_date: DateString;
  check_out_date: DateString;
  number_of_nights: number;
  room_rate: number;
  room_charges: number;
  taxes: number;
  service_charge: number;
  additional_charges: number;
  discounts: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: DbInvoiceStatus;
  line_items: InvoiceLineItem[];
  issued_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface DbHousekeepingTask {
  id: string;
  room_id: string;
  status: DbHousekeepingStatus;
  assigned_staff_id: string | null;
  notes: string | null;
  last_guest_name: string | null;
  last_checkout_at: Timestamp | null;
  expected_completion: Timestamp | null;
  started_at: Timestamp | null;
  completed_at: Timestamp | null;
  created_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbNotification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: DbNotificationType;
  priority: DbNotificationPriority;
  module: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: Timestamp | null;
  metadata: Record<string, unknown>;
  created_at: Timestamp;
}

export interface DbActivityLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  action_code: string;
  module: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  status: DbActivityLogStatus;
  metadata: Record<string, unknown>;
  created_at: Timestamp;
}

export interface DbNightAudit {
  id: string;
  night_audit_number: string;
  audit_date: DateString;
  opened_at: Timestamp;
  closed_at: Timestamp | null;
  opened_by: string | null;
  closed_by: string | null;
  status: DbNightAuditStatus;
  rooms_occupied: number;
  rooms_available: number;
  rooms_cleaning: number;
  rooms_maintenance: number;
  check_ins: number;
  check_outs: number;
  active_stays: number;
  cash_total: number;
  mobile_money_total: number;
  card_total: number;
  bank_transfer_total: number;
  other_total: number;
  gross_revenue: number;
  refund_total: number;
  net_revenue: number;
  cash_expected: number | null;
  cash_counted: number | null;
  cash_variance: number | null;
  variance_notes: string | null;
  notes: string | null;
  reopened_at: Timestamp | null;
  reopened_by: string | null;
  reopen_reason: string | null;
  shift_handover_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbShiftHandover {
  id: string;
  handover_number: string;
  shift_type: DbShiftType;
  opened_by: string | null;
  closed_by: string | null;
  opened_at: Timestamp;
  closed_at: Timestamp | null;
  cash_drawer_amount: number;
  closing_cash: number | null;
  notes: string | null;
  pending_tasks: string | null;
  outstanding_issues: string | null;
  status: DbShiftHandoverStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbHotelSettings {
  id: string;
  hotel_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  currency: string;
  timezone: string;
  check_in_time: string;
  check_out_time: string;
  tax_rate: number;
  service_charge: number;
  late_checkout_fee: number;
  late_checkout_policy_mode: string;
  late_checkout_hour_fee_1_2: number;
  late_checkout_hour_fee_2_4: number;
  late_checkout_hour_fee_4_6: number;
  logo_url: string | null;
  tin_number: string | null;
  description: string | null;
  invoice_prefix: string;
  receipt_prefix: string;
  invoice_footer: string | null;
  terms_and_conditions: string | null;
  email_notifications: boolean;
  sms_notifications: boolean;
  payment_alerts: boolean;
  reservation_alerts: boolean;
  housekeeping_alerts: boolean;
  settings_json: Record<string, unknown>;
  updated_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbPublicBookingRequest {
  id: string;
  booking_request_number: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  room_type_id: string;
  check_in_date: DateString;
  check_out_date: DateString;
  adults: number;
  children: number;
  special_requests: string | null;
  status: DbBookingRequestStatus;
  reviewed_by: string | null;
  reviewed_at: Timestamp | null;
  converted_reservation_id: string | null;
  rejection_reason: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbRoomPhoto {
  id: string;
  room_id: string | null;
  room_type_id: string | null;
  storage_path: string;
  file_name: string | null;
  display_order: number;
  is_cover: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/** Joined / enriched types for repository layer (future) */
export interface DbPublicBookingRequestWithType extends DbPublicBookingRequest {
  room_type: DbRoomType;
}

export interface DbRoomWithType extends DbRoom {
  room_type: DbRoomType;
  floor_record: DbFloor;
}

export interface DbReservationWithRelations extends DbReservation {
  guest: DbGuest;
  room: DbRoomWithType;
  room_type: DbRoomType;
}

export interface DbPaymentWithRelations extends DbPayment {
  guest: DbGuest;
  reservation: DbReservationWithRelations;
}

export interface DbInvoiceWithRelations extends DbInvoice {
  guest: DbGuest;
  reservation: DbReservationWithRelations;
}

export interface DbStaffWithUser extends DbStaffProfile {
  user: DbUser;
  role: DbRole;
}
