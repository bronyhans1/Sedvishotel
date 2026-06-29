/**
 * Cash drawer integration — abstracted for future hardware drivers.
 * Trigger after successful cash sales once receipt printing completes.
 */
export type CashDrawerCommand = {
  saleId: string;
  receiptNumber?: string | null;
  amount: number;
  timestamp: string;
};

export type CashDrawerResult = {
  success: boolean;
  message: string;
};

export interface ICashDrawerService {
  openDrawer(command: CashDrawerCommand): Promise<CashDrawerResult>;
}

/** Default stub — logs intent until hardware driver is configured. */
export class CashDrawerService implements ICashDrawerService {
  async openDrawer(command: CashDrawerCommand): Promise<CashDrawerResult> {
    if (typeof window !== "undefined") {
      console.info("[CashDrawer] Open requested", command);
    }
    return {
      success: true,
      message: "Cash drawer command queued (hardware driver not configured).",
    };
  }
}

export const cashDrawerService = new CashDrawerService();

export async function triggerCashDrawerAfterSale(
  command: CashDrawerCommand
): Promise<CashDrawerResult> {
  return cashDrawerService.openDrawer(command);
}
