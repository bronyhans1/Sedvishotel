import { MOCK_TODAY } from "@/config/mock-dates";
import type { ActivityLog, LogStats } from "@/types/log";

function mockLog(
  entry: Omit<ActivityLog, "actionCode" | "createdAt" | "relativeTime"> & {
    actionCode?: string;
  }
): ActivityLog {
  return {
    ...entry,
    actionCode: entry.actionCode ?? "system.event",
    createdAt: `${entry.date}T12:00:00.000Z`,
    relativeTime: entry.date === MOCK_TODAY ? "Today" : "Yesterday",
  };
}

export const mockActivityLogs: ActivityLog[] = [
  mockLog({
    id: "log_001",
    user: "Efua Mensah",
    userId: "stf_003",
    action: "Checked Guest In",
    module: "Check-In",
    date: MOCK_TODAY,
    time: "09:15 AM",
    ipAddress: "192.168.1.42",
    status: "success",
  }),
  mockLog({
    id: "log_002",
    user: "Alexandra Reed",
    userId: "stf_001",
    action: "Recorded Payment",
    module: "Payments",
    date: MOCK_TODAY,
    time: "10:02 AM",
    ipAddress: "192.168.1.10",
    status: "success",
  }),
  mockLog({
    id: "log_003",
    user: "Kwabena Owusu",
    userId: "stf_002",
    action: "Created Reservation",
    module: "Reservations",
    date: MOCK_TODAY,
    time: "10:45 AM",
    ipAddress: "192.168.1.22",
    status: "success",
  }),
  mockLog({
    id: "log_004",
    user: "Adjoa Mensah",
    userId: "stf_005",
    action: "Updated Room Status",
    module: "Housekeeping",
    date: MOCK_TODAY,
    time: "11:30 AM",
    ipAddress: "192.168.1.55",
    status: "success",
  }),
  mockLog({
    id: "log_005",
    user: "Samuel Tetteh",
    userId: "stf_004",
    action: "Updated Guest",
    module: "Guests",
    date: MOCK_TODAY,
    time: "08:20 AM",
    ipAddress: "192.168.1.38",
    status: "success",
  }),
  mockLog({
    id: "log_006",
    user: "Efua Mensah",
    userId: "stf_003",
    action: "Checked Guest Out",
    module: "Check-Out",
    date: MOCK_TODAY,
    time: "11:00 AM",
    ipAddress: "192.168.1.42",
    status: "success",
  }),
  mockLog({
    id: "log_007",
    user: "Nana Akua",
    userId: "stf_009",
    action: "Recorded Payment",
    module: "Payments",
    date: "2026-06-01",
    time: "04:15 PM",
    ipAddress: "192.168.1.18",
    status: "success",
  }),
  mockLog({
    id: "log_008",
    user: "Alexandra Reed",
    userId: "stf_001",
    action: "Updated Settings",
    module: "Settings",
    date: "2026-06-01",
    time: "02:00 PM",
    ipAddress: "192.168.1.10",
    status: "warning",
  }),
  mockLog({
    id: "log_009",
    user: "Kofi Annan",
    userId: "stf_006",
    action: "Updated Room Status",
    module: "Housekeeping",
    date: MOCK_TODAY,
    time: "07:00 AM",
    ipAddress: "192.168.1.60",
    status: "success",
  }),
  mockLog({
    id: "log_010",
    user: "Kwabena Owusu",
    userId: "stf_002",
    action: "Created Reservation",
    module: "Reservations",
    date: MOCK_TODAY,
    time: "09:00 AM",
    ipAddress: "192.168.1.22",
    status: "success",
  }),
];

export const mockLogStats: LogStats = {
  actionsToday: mockActivityLogs.filter((l) => l.date === MOCK_TODAY).length,
  reservationsCreated: 4,
  paymentsRecorded: 3,
  checkIns: 2,
  checkOuts: 2,
};
