export type DocumentKind = "invoice" | "receipt" | "group_reservation" | "corporate_account";

export type DocumentSequenceState = {
  kind: DocumentKind;
  calendarYear: number;
  startingNumber: number;
  counterLastNumber: number;
  maxIssuedNumber: number;
  nextPreview: string;
  minimumAllowed: number;
};

export interface IDocumentNumberingRepository {
  peekNextNumber(kind: DocumentKind): Promise<string>;
  getSequenceState(kind: DocumentKind): Promise<DocumentSequenceState>;
  setSequence(kind: DocumentKind, nextNumber: number): Promise<DocumentSequenceState>;
}
