export const SupabaseErrorCode = {
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_USER_NOT_FOUND: "AUTH_USER_NOT_FOUND",
  AUTH_EMAIL_CONFIRMATION: "AUTH_EMAIL_CONFIRMATION",
  STORAGE_INVALID_TYPE: "STORAGE_INVALID_TYPE",
  DATABASE_UNIQUE_VIOLATION: "DATABASE_UNIQUE_VIOLATION",
  DATABASE_FOREIGN_KEY_VIOLATION: "DATABASE_FOREIGN_KEY_VIOLATION",
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN: "UNKNOWN",
} as const;

export type SupabaseErrorCodeValue = (typeof SupabaseErrorCode)[keyof typeof SupabaseErrorCode];

export class SupabaseError extends Error {
  code: string;
  status?: number;
  details?: unknown;

  constructor(message: string, code: string, status?: number, details?: unknown) {
    super(message);
    this.name = "SupabaseError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof (error as Record<string, unknown>).code === "string" &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

export function parseSupabaseError(error: unknown): SupabaseError {
  if (isSupabaseError(error)) {
    return new SupabaseError(error.message, error.code, error.status, error.details);
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const err = error as { message?: string; status?: number; code?: string; details?: unknown };
    const message = typeof err.message === "string" ? err.message : "Unknown error";

    if (message.includes("Invalid login credentials")) {
      return new SupabaseError(message, SupabaseErrorCode.AUTH_INVALID_CREDENTIALS, err.status);
    }

    if (message.includes("User not found")) {
      return new SupabaseError(message, SupabaseErrorCode.AUTH_USER_NOT_FOUND, err.status);
    }

    if (message.includes("Email not confirmed")) {
      return new SupabaseError(message, SupabaseErrorCode.AUTH_EMAIL_CONFIRMATION, err.status);
    }

    if (message.includes("invalid file type")) {
      return new SupabaseError(message, SupabaseErrorCode.STORAGE_INVALID_TYPE, err.status);
    }

    if (err.code === "23505") {
      return new SupabaseError(
        message,
        SupabaseErrorCode.DATABASE_UNIQUE_VIOLATION,
        err.status,
        err.details,
      );
    }

    if (err.code === "23503") {
      return new SupabaseError(
        message,
        SupabaseErrorCode.DATABASE_FOREIGN_KEY_VIOLATION,
        err.status,
        err.details,
      );
    }

    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
      return new SupabaseError(message, SupabaseErrorCode.NETWORK_ERROR, err.status);
    }

    return new SupabaseError(message, SupabaseErrorCode.UNKNOWN, err.status, err.details);
  }

  return new SupabaseError(String(error), SupabaseErrorCode.UNKNOWN);
}
