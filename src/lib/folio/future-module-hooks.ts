/** Future restaurant/laundry/spa modules post debits via GuestFolioService.postEntry(). */
export type FutureFolioModules = "restaurant" | "laundry" | "spa";

export const FUTURE_FOLIO_MODULE_HOOKS: Record<
  FutureFolioModules,
  { entryType: string; sourceModule: string }
> = {
  restaurant: { entryType: "restaurant", sourceModule: "restaurant" },
  laundry: { entryType: "laundry", sourceModule: "laundry" },
  spa: { entryType: "spa", sourceModule: "spa" },
};
