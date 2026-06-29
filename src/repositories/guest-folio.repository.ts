import type {
  DbFolioDebitCredit,
  DbFolioEntry,
  DbFolioEntryType,
  DbGuestFolio,
  DbGuestFolioStatus,
  DbGuestFolioWithRelations,
} from "@/types/database";

export type CreateGuestFolioRecord = {
  reservationId: string;
  guestId: string;
  roomId?: string | null;
  folioNumber: string;
};

export type CreateFolioEntryRecord = {
  folioId: string;
  entryType: DbFolioEntryType;
  sourceModule: string;
  sourceReference?: string | null;
  description: string;
  quantity?: number;
  unitAmount?: number;
  subtotal: number;
  vatAmount?: number;
  total: number;
  debitCredit: DbFolioDebitCredit;
  createdBy?: string | null;
};

export interface IGuestFolioRepository {
  getNextFolioNumber(): Promise<string>;
  createFolio(input: CreateGuestFolioRecord): Promise<DbGuestFolio>;
  getById(id: string): Promise<DbGuestFolioWithRelations | null>;
  getOpenByReservationId(reservationId: string): Promise<DbGuestFolioWithRelations | null>;
  getByReservationId(reservationId: string): Promise<DbGuestFolioWithRelations | null>;
  list(options?: {
    status?: DbGuestFolioStatus;
    fromDate?: string;
    toDate?: string;
    search?: string;
  }): Promise<DbGuestFolioWithRelations[]>;
  postEntry(input: CreateFolioEntryRecord): Promise<DbFolioEntry>;
  hasEntryType(folioId: string, entryType: DbFolioEntryType): Promise<boolean>;
  closeFolio(id: string): Promise<DbGuestFolio>;
  listEntries(folioId: string): Promise<DbFolioEntry[]>;
  listEntriesForBusinessDate(businessDate: string): Promise<DbFolioEntry[]>;
  listOpenFoliosWithEntries(): Promise<DbGuestFolioWithRelations[]>;
}

export type {
  DbGuestFolio,
  DbFolioEntry,
  DbGuestFolioWithRelations,
};
