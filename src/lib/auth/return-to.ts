export function sanitizeReturnTo(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  if (!value.startsWith("/")) return undefined;
  if (value.startsWith("//")) return undefined;
  if (value.includes("://") || value.includes("\\")) return undefined;
  return value;
}
