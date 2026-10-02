/** Junta a sugestão do assistente ao texto já digitado, sem apagar o que o usuário escreveu. */
export function mergeComposerSuggestion(current: string, suggestion: string): string {
  const incoming = suggestion.trim();
  if (!incoming) return current;
  const existing = current.trimEnd();
  if (!existing) return incoming;
  if (existing.includes(incoming)) return current;
  const separator = existing.endsWith("\n") ? "" : "\n";
  return `${existing}${separator}${incoming}`;
}

export const COMPOSER_MAX_VISIBLE_LINES = 5;
export const COMPOSER_LINE_HEIGHT_PX = 22;
export const COMPOSER_VERTICAL_PADDING_PX = 16;

export function composerMaxHeightPx(lines = COMPOSER_MAX_VISIBLE_LINES): number {
  return lines * COMPOSER_LINE_HEIGHT_PX + COMPOSER_VERTICAL_PADDING_PX;
}
