import {
  BarChart3,
  BedDouble,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Hotel,
  LogIn,
  LogOut,
  Package,
  Receipt,
  Shield,
  ShoppingCart,
  UserPlus,
  Users,
  Wallet,
  TrendingUp,
  Moon,
  Building2,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { NavPermission } from "@/config/navigation.types";

export type NavChild = {
  title: string;
  href?: string;
  permission?: NavPermission;
  disabled?: boolean;
  badge?: string;
};

export type NavItem = {
  title: string;
  href?: string;
  icon: LucideIcon;
  badge?: string;
  disabled?: boolean;
  permission?: NavPermission;
  children?: NavChild[];
  section?: string;
};

export const mainNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard",
  },
  {
    title: "Rooms",
    icon: BedDouble,
    children: [
      { title: "All Rooms", href: "/dashboard/rooms", permission: "rooms" },
      {
        title: "Room Types",
        href: "/dashboard/rooms/types",
        permission: "room_types",
      },
      {
        title: "Floors",
        href: "/dashboard/floors",
        permission: "floors",
      },
    ],
  },
  {
    title: "Reservations",
    icon: CalendarDays,
    section: "Front Desk",
    children: [
      {
        title: "Individual Reservations",
        href: "/dashboard/reservations",
        permission: "reservations",
      },
      {
        title: "Group Reservations",
        href: "/dashboard/group-reservations",
        permission: "group_reservations",
      },
    ],
  },
  {
    title: "Corporate",
    icon: Building2,
    section: "Front Desk",
    children: [
      {
        title: "Corporate Accounts",
        href: "/dashboard/corporate-accounts",
        permission: "corporate_accounts",
      },
    ],
  },
  {
    title: "Guests",
    href: "/dashboard/guests",
    icon: Users,
    section: "Front Desk",
    permission: "guests",
  },
  {
    title: "Check-In",
    href: "/dashboard/check-in",
    icon: LogIn,
    section: "Front Desk",
    permission: "check_in",
  },
  {
    title: "Active Stays",
    href: "/dashboard/stays",
    icon: Hotel,
    section: "Front Desk",
    permission: "active_stays",
  },
  {
    title: "Guest Folio",
    href: "/dashboard/guest-folio",
    icon: Receipt,
    section: "Front Desk",
    permission: "guest_folio",
  },
  {
    title: "Check-Out",
    href: "/dashboard/check-out",
    icon: LogOut,
    section: "Front Desk",
    permission: "check_out",
  },
  {
    title: "Walk-In Booking",
    href: "/dashboard/walk-in",
    icon: UserPlus,
    section: "Front Desk",
    permission: "walk_in",
  },
  {
    title: "Housekeeping",
    href: "/dashboard/housekeeping",
    icon: ClipboardList,
    section: "Operations",
    permission: "housekeeping",
  },
  {
    title: "Shift Handover",
    href: "/dashboard/shift-handover",
    icon: Clock,
    section: "Operations",
    permission: "shift_handover",
  },
  {
    title: "Inventory",
    icon: Package,
    section: "Inventory",
    children: [
      {
        title: "Product Categories",
        href: "/dashboard/inventory/categories",
        permission: "product_categories",
      },
      {
        title: "Products",
        href: "/dashboard/inventory/products",
        permission: "products",
      },
      {
        title: "Stock",
        href: "/dashboard/inventory/stock",
        permission: "inventory",
      },
    ],
  },
  {
    title: "POS",
    href: "/dashboard/pos",
    icon: ShoppingCart,
    section: "Inventory",
    permission: "pos",
    children: [
      {
        title: "Register",
        href: "/dashboard/pos",
        permission: "pos",
      },
      {
        title: "Sales History",
        href: "/dashboard/pos/history",
        permission: "pos",
      },
    ],
  },
  {
    title: "Payments",
    href: "/dashboard/payments",
    icon: Wallet,
    section: "Finance",
    permission: "payments",
  },
  {
    title: "Invoices",
    href: "/dashboard/invoices",
    icon: FileText,
    section: "Finance",
    permission: "invoices",
  },
  {
    title: "Revenue",
    href: "/dashboard/revenue",
    icon: TrendingUp,
    section: "Finance",
    permission: "revenue",
  },
  {
    title: "Night Audit",
    href: "/dashboard/night-audit",
    icon: Moon,
    section: "Finance",
    permission: "night_audit",
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    section: "Finance",
    permission: "reports",
  },
  {
    title: "Administration",
    icon: Shield,
    section: "Administration",
    children: [
      { title: "Staff", href: "/dashboard/staff", permission: "staff" },
      { title: "Roles", href: "/dashboard/roles", permission: "roles" },
      { title: "Settings", href: "/dashboard/settings", permission: "settings" },
      {
        title: "Activity Logs",
        href: "/dashboard/logs",
        permission: "activity_logs",
      },
      {
        title: "Notifications",
        href: "/dashboard/notifications",
        permission: "notifications",
      },
      { title: "Audit", href: "/dashboard/audit", permission: "audit" },
    ],
  },
];
