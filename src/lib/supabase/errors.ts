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

export interface SupabaseError {
  code: SupabaseErrorCodeValue;
  message: string;
  status?: number;
  details?: unknown;
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
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const err = error as { message?: string; status?: number; code?: string; details?: unknown };
    const message = typeof err.message === "string" ? err.message : "Unknown error";

    if (message.includes("Invalid login credentials")) {
      return { code: SupabaseErrorCode.AUTH_INVALID_CREDENTIALS, message, status: err.status };
    }

    if (message.includes("User not found")) {
      return { code: SupabaseErrorCode.AUTH_USER_NOT_FOUND, message, status: err.status };
    }

    if (message.includes("Email not confirmed")) {
      return { code: SupabaseErrorCode.AUTH_EMAIL_CONFIRMATION, message, status: err.status };
    }

    if (message.includes("invalid file type")) {
      return { code: SupabaseErrorCode.STORAGE_INVALID_TYPE, message, status: err.status };
    }

    if (err.code === "23505") {
      return {
        code: SupabaseErrorCode.DATABASE_UNIQUE_VIOLATION,
        message,
        status: err.status,
        details: err.details,
      };
    }

    if (err.code === "23503") {
      return {
        code: SupabaseErrorCode.DATABASE_FOREIGN_KEY_VIOLATION,
        message,
        status: err.status,
        details: err.details,
      };
    }

    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
      return { code: SupabaseErrorCode.NETWORK_ERROR, message, status: err.status };
    }

    return { code: SupabaseErrorCode.UNKNOWN, message, status: err.status, details: err.details };
  }

  return { code: SupabaseErrorCode.UNKNOWN, message: String(error) };
}
