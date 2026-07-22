import { useEffect, useCallback, useRef } from "react";

interface UseKeyboardOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onBackspace?: () => void;
  enabled?: boolean;
}

export function useKeyboard({
  onEscape,
  onEnter,
  onBackspace,
  enabled = true,
}: UseKeyboardOptions): void {
  const callbacks = useRef({ onEscape, onEnter, onBackspace });

  useEffect(() => {
    callbacks.current = { onEscape, onEnter, onBackspace };
  }, [onEscape, onEnter, onBackspace]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (e.key === "Escape") callbacks.current.onEscape?.();
      if (e.key === "Enter") callbacks.current.onEnter?.();
      if (e.key === "Backspace") callbacks.current.onBackspace?.();
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
}
