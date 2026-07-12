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

export interface DbRoomTypePricingRule {
  id: string;
  room_type_id: string;
  pricing_mode: import("@/types/database/enums").DbPricingMode;
  rate: number;
  effective_from: DateString;
  effective_to: DateString | null;
  status: import("@/types/database/enums").DbPricingRuleStatus;
  is_active: boolean;
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

export interface DbProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type DbProductStatus =
  | "active"
  | "out_of_stock"
  | "inactive"
  | "discontinued";

export interface DbProduct {
  id: string;
  category_id: string;
  barcode: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  selling_price: number;
  cost_price: number | null;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  vat_applicable: boolean;
  available_for_sale: boolean;
  status: DbProductStatus;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type DbProductWithCategory = DbProduct & {
  category: Pick<DbProductCategory, "id" | "name" | "slug"> | null;
};

export type DbStockMovementType =
  | "opening_balance"
  | "stock_in"
  | "stock_out"
  | "adjustment"
  | "damaged"
  | "expired"
  | "returned"
  | "transfer_in"
  | "transfer_out"
  | "pos_sale"
  | "room_charge";

export interface DbStockMovement {
  id: string;
  product_id: string;
  movement_type: DbStockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: Timestamp;
}

export type DbStockMovementWithRelations = DbStockMovement & {
  product: Pick<DbProduct, "id" | "name" | "sku" | "barcode" | "unit"> | null;
  performer: Pick<DbUser, "id" | "full_name"> | null;
};

export type DbSaleCustomerType = "walk_in" | "room_charge";
export type DbSalePaymentStatus = "paid" | "pending" | "void";
export type DbPosPaymentMethod =
  | "cash"
  | "card"
  | "mobile_money"
  | "room_charge";

export interface DbSale {
  id: string;
  sale_number: string;
  customer_type: DbSaleCustomerType;
  reservation_id: string | null;
  guest_id: string | null;
  cashier_id: string;
  subtotal: number;
  vat_amount: number;
  discount: number;
  total: number;
  payment_status: DbSalePaymentStatus;
  vat_applied: boolean;
  vat_rate: number | null;
  notes: string | null;
  created_at: Timestamp;
}

export interface DbSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  vat_applicable: boolean;
  vat_amount: number;
  line_subtotal: number;
  total: number;
  created_at: Timestamp;
}

export interface DbSalePayment {
  id: string;
  sale_id: string;
  payment_method: DbPosPaymentMethod;
  amount: number;
  reference: string | null;
  receipt_number: string | null;
  created_at: Timestamp;
}

export type DbSaleWithRelations = DbSale & {
  items: DbSaleItem[];
  payments: DbSalePayment[];
  cashier: Pick<DbUser, "id" | "full_name"> | null;
  guest: Pick<DbGuest, "id" | "full_name"> | null;
  reservation: Pick<DbReservation, "id" | "reservation_number"> & {
    room: Pick<DbRoom, "room_number"> | null;
  } | null;
};

export type DbGuestFolioStatus = "open" | "closed" | "archived";

export type DbFolioEntryType =
  | "accommodation"
  | "retail_pos"
  | "restaurant"
  | "laundry"
  | "spa"
  | "misc_charge"
  | "manual_charge"
  | "discount"
  | "adjustment"
  | "payment"
  | "refund";

export type DbFolioDebitCredit = "debit" | "credit";

export interface DbGuestFolio {
  id: string;
  reservation_id: string;
  guest_id: string;
  room_id: string | null;
  parent_folio_id: string | null;
  folio_number: string;
  status: DbGuestFolioStatus;
  opened_at: Timestamp;
  closed_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbFolioEntry {
  id: string;
  folio_id: string;
  entry_type: DbFolioEntryType;
  source_module: string;
  source_reference: string | null;
  description: string;
  quantity: number;
  unit_amount: number;
  subtotal: number;
  vat_amount: number;
  total: number;
  debit_credit: DbFolioDebitCredit;
  created_by: string | null;
  created_at: Timestamp;
}

export type DbGuestFolioWithRelations = DbGuestFolio & {
  guest: Pick<DbGuest, "id" | "full_name"> | null;
  room: Pick<DbRoom, "id" | "room_number"> | null;
  reservation: Pick<
    DbReservation,
    | "id"
    | "reservation_number"
    | "check_in_date"
    | "check_out_date"
    | "actual_check_out_date"
    | "status"
  > & {
    room: Pick<DbRoom, "room_number"> | null;
  } | null;
  entries: Array<
    DbFolioEntry & { creator?: Pick<DbUser, "full_name"> | null }
  >;
};

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
  rack_rate: number;
  room_rate: number;
  discount_amount: number;
  discount_percent: number;
  pricing_mode: import("@/types/database/enums").DbPricingMode;
  pricing_source: import("@/types/database/enums").DbPricingSource;
  pricing_rule_id: string | null;
  override_reason: string | null;
  override_reason_detail: string | null;
  overridden_by: string | null;
  approved_by: string | null;
  override_at: Timestamp | null;
  rate_override_history: unknown;
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
  group_reservation_id?: string | null;
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
  vat_applied: boolean;
  vat_rate: number;
  vat_amount: number;
  vat_exemption_reason: string | null;
  vat_exemption_notes: string | null;
  vat_overridden_by: string | null;
  vat_overridden_at: Timestamp | null;
  idempotency_key?: string | null;
  printed_at?: Timestamp | null;
  last_printed_at?: Timestamp | null;
  printed_by?: string | null;
  print_count?: number;
  can_reverse?: boolean;
  reversal_reason?: string | null;
  reversed_by?: string | null;
  reversed_at?: Timestamp | null;
  reversal_reference?: string | null;
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
  vat_collected: number;
  vat_exempt_revenue: number;
  vat_override_count: number;
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
  acknowledged_by: string | null;
  opened_at: Timestamp;
  closed_at: Timestamp | null;
  acknowledged_at: Timestamp | null;
  cash_drawer_amount: number;
  closing_cash: number | null;
  notes: string | null;
  closing_notes: string | null;
  pending_tasks: string | null;
  outstanding_issues: string | null;
  status: DbShiftHandoverStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type DbShiftTaskStatus = "pending" | "completed";
export type DbShiftIssueStatus = "open" | "resolved";

export interface DbShiftHandoverTask {
  id: string;
  description: string;
  status: DbShiftTaskStatus;
  shift_handover_id: string | null;
  origin_shift_handover_id: string;
  created_by: string | null;
  completed_by: string | null;
  completed_at: Timestamp | null;
  completed_during_shift_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DbShiftHandoverIssue {
  id: string;
  description: string;
  status: DbShiftIssueStatus;
  origin_shift_handover_id: string;
  created_by: string | null;
  resolved_by: string | null;
  resolved_at: Timestamp | null;
  resolved_during_shift_id: string | null;
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

export type DbCorporateAccountStatus = "active" | "archived";

export interface DbCorporateAccount {
  id: string;
  account_number: string;
  company_name: string;
  billing_contact_name: string | null;
  billing_contact_email: string | null;
  billing_contact_phone: string | null;
  billing_address: string | null;
  credit_limit: number | null;
  credit_terms: string | null;
  status: DbCorporateAccountStatus;
  notes: string | null;
  created_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type DbGroupReservationType =
  | "corporate"
  | "government"
  | "ngo"
  | "school"
  | "church"
  | "sports_team"
  | "conference"
  | "wedding"
  | "tour"
  | "other";

export type DbGroupReservationStatus =
  | "draft"
  | "confirmed"
  | "partially_checked_in"
  | "in_house"
  | "partially_checked_out"
  | "completed"
  | "closed"
  | "cancelled";

export type DbGroupBillingPolicy =
  | "company_pays_all"
  | "guest_pays_all"
  | "company_pays_accommodation"
  | "guest_pays_extras"
  | "mixed_billing"
  | "deposit"
  | "credit"
  | "complimentary"
  | "pay_at_check_out";

export interface DbGroupReservation {
  id: string;
  group_number: string;
  group_name: string;
  group_type: DbGroupReservationType;
  status: DbGroupReservationStatus;
  billing_policy: DbGroupBillingPolicy;
  corporate_account_id: string | null;
  master_reservation_id: string | null;
  arrival_date: DateString;
  departure_date: DateString;
  expected_rooms: number;
  expected_guests: number;
  actual_rooms: number;
  actual_guests: number;
  notes: string | null;
  created_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type DbReservationBlockStatus =
  | "blocked"
  | "allocated"
  | "released"
  | "cancelled"
  | "expired";

export interface DbReservationBlock {
  id: string;
  group_reservation_id: string;
  room_id: string;
  room_type_id: string;
  hold_until: Timestamp;
  released_at: Timestamp | null;
  status: DbReservationBlockStatus;
  created_by: string | null;
  created_at: Timestamp;
}

export type DbGroupTimelineEventType =
  | "group_created"
  | "company_updated"
  | "reservation_added"
  | "reservation_removed"
  | "room_assigned"
  | "room_changed"
  | "guest_assigned"
  | "guest_checked_in"
  | "guest_checked_out"
  | "deposit_paid"
  | "invoice_generated"
  | "receipt_printed"
  | "payment_recorded"
  | "refund"
  | "pos_room_charge"
  | "minibar_charge"
  | "restaurant_charge"
  | "laundry_charge"
  | "issue_created"
  | "issue_closed"
  | "reservation_cancelled"
  | "group_closed"
  | "block_created"
  | "block_released"
  | "block_expired"
  | "group_confirmed"
  | "group_cancelled";

export interface DbGroupTimelineEvent {
  id: string;
  group_reservation_id: string;
  event_type: DbGroupTimelineEventType;
  description: string;
  entity_type: string | null;
  entity_id: string | null;
  staff_id: string | null;
  staff_name: string | null;
  metadata: Record<string, unknown>;
  created_at: Timestamp;
}
