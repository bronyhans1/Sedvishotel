import type { StaffMember, StaffRole, StaffStats, StaffStatus } from "@/types/staff";

type MockStaffSeed = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  department: string;
  status: StaffStatus;
  dateJoined: string;
  lastLogin: string;
  notes: string[];
};

function mockEntry(entry: MockStaffSeed): StaffMember {
  return {
    ...entry,
    userId: entry.id,
    employeeId: entry.id.toUpperCase(),
  };
}

const rawMockStaff: MockStaffSeed[] = [
  {
    id: "stf_001",
    fullName: "Alexandra Reed",
    email: "admin@sedvis-hotel.com",
    phone: "+233 24 100 0001",
    role: "admin",
    department: "Administration",
    status: "active",
    dateJoined: "2024-01-15",
    lastLogin: "2026-06-02 · 08:45 AM",
    notes: ["System administrator", "Full platform access"],
  },
  {
    id: "stf_002",
    fullName: "Kwabena Owusu",
    email: "k.owusu@sedvis-hotel.com",
    phone: "+233 24 100 0002",
    role: "manager",
    department: "Operations",
    status: "active",
    dateJoined: "2024-03-10",
    lastLogin: "2026-06-02 · 09:12 AM",
    notes: ["Duty manager", "Weekend supervisor"],
  },
  {
    id: "stf_003",
    fullName: "Efua Mensah",
    email: "e.mensah@sedvis-hotel.com",
    phone: "+233 55 200 0003",
    role: "receptionist",
    department: "Front Desk",
    status: "active",
    dateJoined: "2024-06-01",
    lastLogin: "2026-06-02 · 07:30 AM",
    notes: ["Morning shift lead"],
  },
  {
    id: "stf_004",
    fullName: "Samuel Tetteh",
    email: "s.tetteh@sedvis-hotel.com",
    phone: "+233 27 300 0004",
    role: "receptionist",
    department: "Front Desk",
    status: "active",
    dateJoined: "2025-01-20",
    lastLogin: "2026-06-01 · 11:45 PM",
    notes: ["Night shift"],
  },
  {
    id: "stf_005",
    fullName: "Adjoa Mensah",
    email: "a.mensah@sedvis-hotel.com",
    phone: "+233 24 400 0005",
    role: "housekeeping",
    department: "Housekeeping",
    status: "active",
    dateJoined: "2024-08-12",
    lastLogin: "2026-06-02 · 06:00 AM",
    notes: ["Floor supervisor — floors 2–3"],
  },
  {
    id: "stf_006",
    fullName: "Kofi Annan",
    email: "k.annan@sedvis-hotel.com",
    phone: "+233 20 500 0006",
    role: "housekeeping",
    department: "Housekeeping",
    status: "active",
    dateJoined: "2025-02-14",
    lastLogin: "2026-06-02 · 06:15 AM",
    notes: [],
  },
  {
    id: "stf_007",
    fullName: "Akosua Boateng",
    email: "a.boateng@sedvis-hotel.com",
    phone: "+233 26 600 0007",
    role: "housekeeping",
    department: "Housekeeping",
    status: "active",
    dateJoined: "2025-04-01",
    lastLogin: "2026-06-01 · 05:50 PM",
    notes: ["Ground floor specialist"],
  },
  {
    id: "stf_008",
    fullName: "Emmanuel Osei",
    email: "e.osei@sedvis-hotel.com",
    phone: "+233 55 700 0008",
    role: "housekeeping",
    department: "Housekeeping",
    status: "suspended",
    dateJoined: "2024-11-05",
    lastLogin: "2026-05-28 · 02:00 PM",
    notes: ["Suspended pending review"],
  },
  {
    id: "stf_009",
    fullName: "Nana Akua",
    email: "n.akua@sedvis-hotel.com",
    phone: "+233 24 800 0009",
    role: "manager",
    department: "Finance",
    status: "active",
    dateJoined: "2024-05-22",
    lastLogin: "2026-06-02 · 10:00 AM",
    notes: ["Revenue & billing oversight"],
  },
  {
    id: "stf_010",
    fullName: "Yaw Darko",
    email: "y.darko@sedvis-hotel.com",
    phone: "+233 27 900 0010",
    role: "receptionist",
    department: "Front Desk",
    status: "suspended",
    dateJoined: "2023-09-01",
    lastLogin: "2026-03-15 · 04:30 PM",
    notes: ["On extended leave"],
  },
];

export const mockStaff: StaffMember[] = rawMockStaff.map(mockEntry);

export function getStaffById(id: string): StaffMember | undefined {
  return mockStaff.find((s) => s.id === id);
}

export function computeStaffStats(staff: StaffMember[]): StaffStats {
  return {
    total: staff.length,
    active: staff.filter((s) => s.status === "active").length,
    managers: staff.filter((s) => s.role === "manager").length,
    receptionists: staff.filter((s) => s.role === "receptionist").length,
    housekeeping: staff.filter((s) => s.role === "housekeeping").length,
    suspended: staff.filter((s) => s.status === "suspended").length,
  };
}

export const mockStaffStats = computeStaffStats(mockStaff);
