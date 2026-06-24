/** Serializable RBAC flags for Room Types UI (from server session). */
export type RoomTypeAccess = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canArchive: boolean;
  canDelete: boolean;
};
