/* =========================================================
   errors.ts — Erros previsíveis da camada de persistência
   local (Fase 1C-1).

   Erros de persistência NUNCA são escondidos silenciosamente:
   toda operação converte falhas de baixo nível em
   PersistenceError com um code identificável, espelhando o
   padrão de SupabaseError usado no restante do projeto.
   ========================================================= */

export const PersistenceErrorCode = {
  /** O ambiente não oferece IndexedDB (ex.: SSR/test runner). */
  ADAPTER_UNAVAILABLE: "ADAPTER_UNAVAILABLE",
  DATABASE_OPEN_FAILED: "DATABASE_OPEN_FAILED",
  /** Banco existente é incompatível com o schema declarado. */
  SCHEMA_MISMATCH: "SCHEMA_MISMATCH",
  /** Store inexistente no banco aberto. */
  STORE_MISSING: "STORE_MISSING",
  /** Registro obrigatório não encontrado. */
  NOT_FOUND: "NOT_FOUND",
  /** Valor não serializável / inválido para armazenamento. */
  SERIALIZATION: "SERIALIZATION",
  UNKNOWN: "UNKNOWN",
} as const;

export type PersistenceErrorCodeValue =
  (typeof PersistenceErrorCode)[keyof typeof PersistenceErrorCode];

export interface PersistenceErrorOptions {
  cause?: unknown;
}

export class PersistenceError extends Error {
  readonly code: PersistenceErrorCodeValue;
  readonly cause?: unknown;

  constructor(message: string, code: PersistenceErrorCodeValue, options?: PersistenceErrorOptions) {
    super(message, options ? { cause: options.cause } : undefined);
    this.name = "PersistenceError";
    this.code = code;
    this.cause = options?.cause;
  }
}

/** Normaliza qualquer erro em PersistenceError identificável. */
export function toPersistenceError(
  error: unknown,
  fallback: PersistenceErrorCodeValue,
  prefix?: string,
): PersistenceError {
  if (error instanceof PersistenceError) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new PersistenceError(prefix ? `${prefix}: ${message}` : message, fallback, {
    cause: error,
  });
}
