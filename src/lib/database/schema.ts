/** Canonical Postgres table names */
export const DbTables = {
  roles: "roles",
  permissions: "permissions",
  rolePermissions: "role_permissions",
  users: "users",
  staffProfiles: "staff_profiles",
  roomTypes: "room_types",
  floors: "floors",
  rooms: "rooms",
  guests: "guests",
  reservations: "reservations",
  reservationGuests: "reservation_guests",
  payments: "payments",
  paymentTransactions: "payment_transactions",
  invoices: "invoices",
  housekeepingTasks: "housekeeping_tasks",
  notifications: "notifications",
  activityLogs: "activity_logs",
  nightAudits: "night_audits",
  shiftHandovers: "shift_handovers",
  hotelSettings: "hotel_settings",
  publicBookingRequests: "public_booking_requests",
  productCategories: "product_categories",
  products: "products",
} as const;

export type DbTableName = (typeof DbTables)[keyof typeof DbTables];
