/** Non-inventory operational figures only — room KPIs come from live room data */
export const mockDashboardOperations = {
  checkInsToday: 3,
  checkOutsToday: 2,
} as const;

export const mockRecentActivity = [
  {
    id: "1",
    guest: "Ama Osei",
    room: "003",
    action: "Check-in",
    time: "09:15 AM",
  },
  {
    id: "2",
    guest: "Michael Chen",
    room: "015",
    action: "Check-out",
    time: "10:02 AM",
  },
  {
    id: "3",
    guest: "Kwame Mensah",
    room: "012",
    action: "Reservation",
    time: "10:45 AM",
  },
  {
    id: "4",
    guest: "Fatima Al-Rashid",
    room: "021",
    action: "Check-in",
    time: "11:30 AM",
  },
] as const;
