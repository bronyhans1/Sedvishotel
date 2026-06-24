import { ServiceError } from "@/services/types";

const ACCESS_DENIED_MESSAGE =
  "You do not have permission to perform this action.";

const PG_ERROR_PATTERNS: { pattern: RegExp; message: string }[] = [
  {
    pattern: /duplicate key value violates unique constraint/i,
    message: "A record with these details already exists.",
  },
  {
    pattern: /violates unique constraint/i,
    message: "This value is already in use.",
  },
  {
    pattern: /violates foreign key constraint/i,
    message: "This action cannot be completed because related records exist.",
  },
  {
    pattern: /invalid input value for enum/i,
    message: "One of the selected values is not valid.",
  },
  {
    pattern: /row-level security/i,
    message: "You do not have permission to perform this action.",
  },
  {
    pattern: /storage object not found/i,
    message: "Unable to find the uploaded file. Please try again.",
  },
  {
    pattern: /failed to upload photo/i,
    message: "Unable to upload image. Please try again.",
  },
  {
    pattern: /bucket not found/i,
    message: "File storage is not configured. Contact your administrator.",
  },
  {
    pattern: /payload too large|file size limit/i,
    message: "The file is too large. Please choose a smaller image.",
  },
];

function mapDatabaseError(message: string): string | null {
  for (const { pattern, message: friendly } of PG_ERROR_PATTERNS) {
    if (pattern.test(message)) return friendly;
  }
  return null;
}

export function toSafeActionError(err: unknown): string {
  if (err instanceof ServiceError) {
    if (err.code === "FORBIDDEN" || err.code === "UNAUTHORIZED") {
      return ACCESS_DENIED_MESSAGE;
    }
    return err.message;
  }

  if (err instanceof Error) {
    if (err.message.startsWith("Forbidden:")) {
      return ACCESS_DENIED_MESSAGE;
    }

    const mapped = mapDatabaseError(err.message);
    if (mapped) return mapped;

    if (looksLikeRawTechnicalError(err.message)) {
      return "Something went wrong. Please try again.";
    }

    return err.message;
  }

  return "Something went wrong.";
}

function looksLikeRawTechnicalError(message: string): boolean {
  return (
    /violates|constraint|postgres|supabase|pgrst|jwt|rpc/i.test(message) ||
    message.includes("::") ||
    /^[a-z]+(\.[a-z]+)+$/i.test(message.trim())
  );
}

export function toActionResult<T extends { success: false; error: string }>(
  err: unknown,
  extra?: Partial<T>
): T {
  return {
    success: false,
    error: toSafeActionError(err),
    ...extra,
  } as T;
}
