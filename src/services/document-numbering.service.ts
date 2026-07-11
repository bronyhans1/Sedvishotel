import type { AuthSession } from "@/services/auth.service";
import type { ServiceContext } from "@/services/types";
import { ServiceError } from "@/services/types";
import type {
  DocumentKind,
  DocumentSequenceState,
  IDocumentNumberingRepository,
} from "@/repositories/document-numbering.repository";

export type DocumentNumberPreviews = {
  invoice: string;
  receipt: string;
};

export class DocumentNumberingService {
  constructor(private readonly numbering: IDocumentNumberingRepository) {}

  private requireAdmin(session: AuthSession): void {
    if (session.roleId !== "admin") {
      throw new ServiceError(
        "Forbidden: administrator access required",
        "FORBIDDEN",
        403
      );
    }
  }

  async getPreviews(): Promise<DocumentNumberPreviews> {
    const [invoice, receipt] = await Promise.all([
      this.numbering.peekNextNumber("invoice"),
      this.numbering.peekNextNumber("receipt"),
    ]);

    return { invoice, receipt };
  }

  async getSequenceState(
    kind: DocumentKind
  ): Promise<DocumentSequenceState> {
    return this.numbering.getSequenceState(kind);
  }

  async setSequence(
    ctx: ServiceContext,
    session: AuthSession,
    kind: DocumentKind,
    nextNumber: number
  ): Promise<DocumentSequenceState> {
    this.requireAdmin(session);

    if (!Number.isFinite(nextNumber) || nextNumber < 1) {
      throw new ServiceError(
        "Next sequence number must be at least 1",
        "VALIDATION",
        400
      );
    }

    return this.numbering.setSequence(kind, Math.floor(nextNumber));
  }
}
