export type CleaningStatus =
  | "pending_cleaning"
  | "cleaning"
  | "ready"
  | "maintenance";

export type HousekeepingTask = {
  id: string;
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  floorLabel: string;
  status: CleaningStatus;
  assignedStaff: string;
  notes: string;
  lastGuest: string;
  lastCheckoutTime: string;
  expectedCompletion: string;
};

export type HousekeepingStats = {
  pendingCleaning: number;
  currentlyCleaning: number;
  readyRooms: number;
  maintenanceRooms: number;
};
