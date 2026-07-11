import type {
  DocumentKind,
  DocumentSequenceState,
  IDocumentNumberingRepository,
} from "@/repositories/document-numbering.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";

type SequenceStatePayload = {
  kind: string;
  calendar_year: number;
  starting_number: number;
  counter_last_number: number;
  max_issued_number: number;
  next_preview: string;
  minimum_allowed: number;
};

function mapSequenceState(payload: SequenceStatePayload): DocumentSequenceState {
  return {
    kind: payload.kind as DocumentKind,
    calendarYear: Number(payload.calendar_year),
    startingNumber: Number(payload.starting_number),
    counterLastNumber: Number(payload.counter_last_number),
    maxIssuedNumber: Number(payload.max_issued_number),
    nextPreview: payload.next_preview,
    minimumAllowed: Number(payload.minimum_allowed),
  };
}

export class SupabaseDocumentNumberingRepository
  implements IDocumentNumberingRepository
{
  constructor(private readonly client: SupabaseServerClient) {}

  async peekNextNumber(kind: DocumentKind): Promise<string> {
    const { data, error } = await this.client.rpc("shms_peek_next_document_number", {
      p_kind: kind,
    });

    if (error) {
      throw new Error(`Failed to preview next ${kind} number: ${error.message}`);
    }

    return String(data ?? "");
  }

  async getSequenceState(kind: DocumentKind): Promise<DocumentSequenceState> {
    const { data, error } = await this.client.rpc("shms_get_document_sequence_state", {
      p_kind: kind,
    });

    if (error) {
      throw new Error(`Failed to load ${kind} sequence state: ${error.message}`);
    }

    return mapSequenceState(data as unknown as SequenceStatePayload);
  }

  async setSequence(
    kind: DocumentKind,
    nextNumber: number
  ): Promise<DocumentSequenceState> {
    const { data, error } = await this.client.rpc("shms_set_document_sequence", {
      p_kind: kind,
      p_next_number: nextNumber,
    });

    if (error) {
      throw new Error(error.message);
    }

    return mapSequenceState(data as unknown as SequenceStatePayload);
  }
}
