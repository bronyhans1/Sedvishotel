/**
 * Stage 5 Guest Folio integration — POS room charges post via GuestFolioService.
 */
export {
  mapSaleToFolioCharge,
  GUEST_FOLIO_SALE_QUERY,
  GUEST_FOLIO_POST_ENTRY,
} from "@/lib/pos/folio-hooks";

export { GUEST_FOLIO_POST_ENTRY as GUEST_FOLIO_ENTRYPOINT } from "@/lib/pos/folio-hooks";
