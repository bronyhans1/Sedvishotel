import type { ShiftType } from "@/types/night-audit";

export type { ShiftType };

export type ShiftHandoverStatus = "open" | "closed";

export type ShiftHandover = {
  id: string;
  handoverNumber: string;
  shiftType: ShiftType;
  openedById: string | null;
  openedByName: string | null;
  closedById: string | null;
  closedByName: string | null;
  openedAt: string;
  closedAt: string | null;
  cashDrawerAmount: number;
  closingCash: number | null;
  notes: string | null;
  pendingTasks: string | null;
  outstandingIssues: string | null;
  status: ShiftHandoverStatus;
};

export type OpenShiftInput = {
  shiftType: ShiftType;
  cashDrawerAmount: number;
  notes?: string;
  pendingTasks?: string;
  outstandingIssues?: string;
};

export type CloseShiftInput = {
  notes?: string;
  outstandingIssues?: string;
  closingCash: number;
};

export type ShiftHandoverPageData = {
  currentShift: ShiftHandover | null;
  history: ShiftHandover[];
};
