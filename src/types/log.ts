export type LogStatus = "success" | "warning" | "failed";

export type ActivityLog = {
  id: string;
  user: string;
  userId: string;
  action: string;
  module: string;
  date: string;
  time: string;
  ipAddress: string;
  status: LogStatus;
  actionCode: string;
  createdAt: string;
  relativeTime: string;
};

export type LogStats = {
  actionsToday: number;
  reservationsCreated: number;
  paymentsRecorded: number;
  checkIns: number;
  checkOuts: number;
};
