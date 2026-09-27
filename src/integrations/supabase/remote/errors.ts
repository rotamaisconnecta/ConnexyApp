export const RemoteErrorCode = {
  AUTH: "AUTH",
  RLS: "RLS",
  NOT_FOUND: "NOT_FOUND",
  UNIQUE: "UNIQUE",
  CHECK: "CHECK",
  FOREIGN_KEY: "FOREIGN_KEY",
  VALIDATION: "VALIDATION",
  NETWORK: "NETWORK",
  UNKNOWN: "UNKNOWN",
} as const;

export type RemoteErrorCodeValue = (typeof RemoteErrorCode)[keyof typeof RemoteErrorCode];

export class RemoteRepositoryError extends Error {
  readonly code: RemoteErrorCodeValue;
  readonly status?: number;
  readonly details?: unknown;

  constructor(message: string, code: RemoteErrorCodeValue, status?: number, details?: unknown) {
    super(message);
    this.name = "RemoteRepositoryError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type PostgrestLike = {
  message?: string;
  code?: string;
  details?: unknown;
  hint?: string;
  status?: number;
};

export function mapPostgrestError(error: PostgrestLike, status?: number): RemoteRepositoryError {
  const message = error.message?.trim() || "Supabase request failed";
  const code = error.code ?? "";
  const http = status ?? error.status;

  if (http === 401 || code === "PGRST301" || /jwt|not authenticated|authorization/i.test(message)) {
    return new RemoteRepositoryError(message, RemoteErrorCode.AUTH, http, error.details);
  }
  if (http === 403 || code === "42501" || /row-level security|permission denied/i.test(message)) {
    return new RemoteRepositoryError(message, RemoteErrorCode.RLS, http, error.details);
  }
  if (code === "PGRST116") {
    return new RemoteRepositoryError(message, RemoteErrorCode.NOT_FOUND, http, error.details);
  }
  if (code === "23505") {
    return new RemoteRepositoryError(message, RemoteErrorCode.UNIQUE, http, error.details);
  }
  if (code === "23514") {
    return new RemoteRepositoryError(message, RemoteErrorCode.CHECK, http, error.details);
  }
  if (code === "23503") {
    return new RemoteRepositoryError(message, RemoteErrorCode.FOREIGN_KEY, http, error.details);
  }
  if (code === "23502" || /null value|violates check/i.test(message)) {
    return new RemoteRepositoryError(message, RemoteErrorCode.VALIDATION, http, error.details);
  }
  if (/failed to fetch|networkerror|fetch failed/i.test(message)) {
    return new RemoteRepositoryError(message, RemoteErrorCode.NETWORK, http, error.details);
  }
  return new RemoteRepositoryError(message, RemoteErrorCode.UNKNOWN, http, error.details);
}

export function throwIfPostgrestError(error: PostgrestLike | null, status?: number): void {
  if (!error) return;
  throw mapPostgrestError(error, status);
}
