import { AdapterMappingCode, AdapterMappingError } from "./errors";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSchemaAUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Demo ids (`lucas`, `demo-direct-…`, `business-${Date.now()}`) are not Schema A PKs. */
export function requireSchemaAUuid(value: string, field: string): string {
  if (!isSchemaAUuid(value)) {
    throw new AdapterMappingError(
      `${field} is not a Schema A UUID`,
      AdapterMappingCode.NOT_UUID,
      field,
    );
  }
  return value;
}

export function optionalSchemaAUuid(value: string | null | undefined): string | null {
  if (!value) return null;
  return isSchemaAUuid(value) ? value : null;
}

export function epochMsToIso(ms: number): string {
  return new Date(ms).toISOString();
}

export function isoToEpochMs(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

/** Schema A time columns are `time`; local stores `HH:MM` or `HH:MM:SS`. */
export function toRemoteTime(value: string): string {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  return trimmed;
}

export function fromRemoteTime(value: string): string {
  return value.length === 8 && value.endsWith(":00") ? value.slice(0, 5) : value;
}
