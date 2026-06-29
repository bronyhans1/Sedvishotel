import type { DbStockMovementType } from "@/types/database";

export type StockMovementType = DbStockMovementType;

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productBarcode: string;
  movementType: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType: string | null;
  referenceId: string | null;
  reason: string | null;
  notes: string | null;
  movementSource: string;
  performedById: string | null;
  performedByName: string | null;
  createdAt: string;
};

export type InventoryStats = {
  totalProducts: number;
  totalInventoryValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  todaysMovements: number;
};

export type StockMovementInput = {
  productId: string;
  quantity: number;
  reason?: string;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
};

export type StockAdjustmentInput = {
  productId: string;
  physicalCount: number;
  reason?: string;
  notes?: string;
};

export type OpeningBalanceInput = {
  productId: string;
  quantity: number;
  reason?: string;
  notes?: string;
};

export type StockMovementSortKey =
  | "createdAt"
  | "product"
  | "quantity"
  | "movementType"
  | "newStock";

export type StockMovementSortDirection = "asc" | "desc";

export type StockMovementTypeFilter = "all" | StockMovementType;

export const STOCK_MOVEMENT_TYPE_OPTIONS: {
  value: StockMovementType;
  label: string;
}[] = [
  { value: "opening_balance", label: "Opening Balance" },
  { value: "stock_in", label: "Stock In" },
  { value: "stock_out", label: "Stock Out" },
  { value: "adjustment", label: "Adjustment" },
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "returned", label: "Returned" },
  { value: "transfer_in", label: "Transfer In" },
  { value: "transfer_out", label: "Transfer Out" },
  { value: "pos_sale", label: "POS Sale" },
  { value: "room_charge", label: "Room Charge" },
];

export const ACTIVE_STOCK_MOVEMENT_TYPES: StockMovementType[] = [
  "opening_balance",
  "stock_in",
  "stock_out",
  "adjustment",
];
