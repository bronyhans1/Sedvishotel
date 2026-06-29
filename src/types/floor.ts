export type Floor = {
  id: string;
  name: string;
  displayOrder: number;
  description: string;
  active: boolean;
  roomCount: number;
};

export type FloorStats = {
  totalFloors: number;
  activeFloors: number;
  archivedFloors: number;
  totalRooms: number;
};

export type FloorFormValues = {
  name: string;
  displayOrder: number;
  description: string;
};

export type FloorOption = {
  id: string;
  name: string;
  displayOrder: number;
};
