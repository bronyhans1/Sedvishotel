/** Serializable RBAC flags for Rooms UI. */
export type RoomAccess = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canChangeStatus: boolean;
  canArchive: boolean;
  canDelete: boolean;
};
