export function canMoveRoom(status: string): boolean {
  return status === "checked_in";
}

export function computeRoomMovePriceDifference(
  oldTotalAmount: number,
  newTotalAmount: number
): number {
  return Math.round((newTotalAmount - oldTotalAmount) * 100) / 100;
}
