import { RemoteErrorCode, RemoteRepositoryError, throwIfPostgrestError } from "./errors";

type QueryResult<T> = {
  data: T;
  error: { message?: string; code?: string; details?: unknown; hint?: string } | null;
  status?: number;
};

export async function runRemote<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof RemoteRepositoryError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    if (/failed to fetch|networkerror|fetch failed|econnrefused|enotfound/i.test(message)) {
      throw new RemoteRepositoryError(message, RemoteErrorCode.NETWORK);
    }
    throw new RemoteRepositoryError(message, RemoteErrorCode.UNKNOWN, undefined, error);
  }
}

export function unwrapRow<T>(result: QueryResult<T>, notFoundMessage: string): NonNullable<T> {
  throwIfPostgrestError(result.error, result.status);
  if (result.data == null) {
    throw new RemoteRepositoryError(notFoundMessage, RemoteErrorCode.NOT_FOUND, 404);
  }
  return result.data as NonNullable<T>;
}

export function unwrapMaybe<T>(result: QueryResult<T>): T {
  throwIfPostgrestError(result.error, result.status);
  return result.data;
}

export function unwrapList<T>(result: QueryResult<T[] | null>): T[] {
  throwIfPostgrestError(result.error, result.status);
  return result.data ?? [];
}
