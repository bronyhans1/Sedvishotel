export type HotelOperatingDayStatus = "open" | "closed";

export type HotelOperatingDay = {
  id: number;
  currentBusinessDate: string;
  status: HotelOperatingDayStatus;
  openedAt: string;
  closedAt: string | null;
  openedById: string | null;
  openedByName: string | null;
  advancedById: string | null;
  advancedByName: string | null;
  nightAuditId: string | null;
  notes: string | null;
  updatedAt: string;
};

export type AdvanceBusinessDateResult = {
  advanced: boolean;
  previousBusinessDate: string;
  currentBusinessDate: string;
};
