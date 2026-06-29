import type {
  DbStockMovement,
  DbStockMovementType,
  DbStockMovementWithRelations,
} from "@/types/database";
import type { RecordStockMovementParams } from "@/lib/inventory/mapper";

export interface IInventoryRepository {
  getCurrentStock(productId: string): Promise<number>;
  createMovement(params: RecordStockMovementParams): Promise<DbStockMovement>;
  listMovements(options?: {
    productId?: string;
    movementType?: DbStockMovementType;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }): Promise<DbStockMovementWithRelations[]>;
  getMovement(id: string): Promise<DbStockMovementWithRelations | null>;
  hasOpeningBalance(productId: string): Promise<boolean>;
  openingBalance(params: RecordStockMovementParams): Promise<DbStockMovement>;
  stockIn(params: RecordStockMovementParams): Promise<DbStockMovement>;
  stockOut(params: RecordStockMovementParams): Promise<DbStockMovement>;
  adjustStock(params: RecordStockMovementParams): Promise<DbStockMovement>;
  getLowStockProducts(): Promise<
    Array<{
      id: string;
      name: string;
      sku: string;
      current_stock: number;
      minimum_stock: number;
    }>
  >;
  countMovementsSince(sinceIso: string): Promise<number>;
}
