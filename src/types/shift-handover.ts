import type { ShiftType } from "@/types/night-audit";

export type { ShiftType };

export type ShiftHandoverStatus = "open" | "closed";
export type ShiftTaskStatus = "pending" | "completed";
export type ShiftIssueStatus = "open" | "resolved";

export type ShiftHandover = {
  id: string;
  handoverNumber: string;
  shiftType: ShiftType;
  openedById: string | null;
  openedByName: string | null;
  closedById: string | null;
  closedByName: string | null;
  acknowledgedById: string | null;
  acknowledgedByName: string | null;
  openedAt: string;
  closedAt: string | null;
  acknowledgedAt: string | null;
  cashDrawerAmount: number;
  closingCash: number | null;
  cashVariance: number | null;
  openingNotes: string | null;
  closingNotes: string | null;
  /** Legacy text snapshot of pending tasks at close */
  pendingTasksSnapshot: string | null;
  /** Legacy text snapshot of open issues at close */
  outstandingIssuesSnapshot: string | null;
  status: ShiftHandoverStatus;
  tasksCompletedCount: number;
  issuesResolvedCount: number;
};

export type ShiftHandoverTask = {
  id: string;
  description: string;
  status: ShiftTaskStatus;
  shiftHandoverId: string | null;
  originShiftHandoverId: string;
  createdById: string | null;
  createdByName: string | null;
  completedById: string | null;
  completedByName: string | null;
  completedAt: string | null;
  completedDuringShiftId: string | null;
  createdAt: string;
};

export type ShiftHandoverIssue = {
  id: string;
  description: string;
  status: ShiftIssueStatus;
  originShiftHandoverId: string;
  createdById: string | null;
  createdByName: string | null;
  resolvedById: string | null;
  resolvedByName: string | null;
  resolvedAt: string | null;
  resolvedDuringShiftId: string | null;
  createdAt: string;
};

export type HandoverPackage = {
  shift: ShiftHandover;
  pendingTasks: ShiftHandoverTask[];
  openIssues: ShiftHandoverIssue[];
};

export type OpenShiftInput = {
  shiftType: ShiftType;
  cashDrawerAmount: number;
  notes?: string;
  pendingTasks?: string;
  outstandingIssues?: string;
  taskItems?: string[];
  issueItems?: string[];
};

export type CloseShiftInput = {
  closingCash: number;
  closingNotes?: string;
  pendingTasks?: string;
  outstandingIssues?: string;
};

export type ShiftHandoverPageData = {
  currentShift: ShiftHandover | null;
  history: ShiftHandover[];
  pendingTasks: ShiftHandoverTask[];
  openIssues: ShiftHandoverIssue[];
  recentlyClosed: ShiftHandover | null;
  pendingAcknowledgement: ShiftHandover | null;
  pendingAckTasks: ShiftHandoverTask[];
  pendingAckIssues: ShiftHandoverIssue[];
  attentionCount: number;
};
