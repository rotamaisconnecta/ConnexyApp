/** Caption visível na bolha. Nomes técnicos de arquivo nunca entram na UI. */
export function visibleMediaCaption(
  caption?: string | null,
  extras: { fileName?: string | null; mediaId?: string | null } = {},
): string | undefined {
  const value = caption?.trim();
  if (!value) return undefined;
  const fileName = extras.fileName?.trim();
  const mediaId = extras.mediaId?.trim();
  if (fileName && value === fileName) return undefined;
  if (mediaId && value === mediaId) return undefined;
  if (/^blob:/i.test(value)) return undefined;
  if (/^[0-9a-f]{8}-[0-9a-f-]{4,}$/i.test(value)) return undefined;
  if (/^(local-media|demo-media|media)[-_]/i.test(value)) return undefined;
  if (/^IMG[_-]?\d+/i.test(value)) return undefined;
  if (/\.(jpe?g|png|gif|webp|heic|heif|mp4|webm|mov)$/i.test(value) && !/\s/.test(value)) {
    return undefined;
  }
  return value;
}
