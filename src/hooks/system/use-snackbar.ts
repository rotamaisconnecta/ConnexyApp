import { useState, useCallback, useRef } from "react";
import type { SnackbarData, SnackbarVariantValue } from "@/lib/system/system-types";

interface UseSnackbarReturn {
  snackbars: SnackbarData[];
  addSnackbar: (variant: SnackbarVariantValue, message: string, duration?: number) => string;
  removeSnackbar: (id: string) => void;
  clearAll: () => void;
  show: (message: string) => string;
  success: (message: string) => string;
  error: (message: string) => string;
}

let snackbarCounter = 0;

export function useSnackbar(): UseSnackbarReturn {
  const [snackbars, setSnackbars] = useState<SnackbarData[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeSnackbar = useCallback((id: string) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addSnackbar = useCallback(
    (variant: SnackbarVariantValue, message: string, duration: number = 3000): string => {
      snackbarCounter += 1;
      const id = `snackbar-${snackbarCounter}`;
      setSnackbars((prev) => [...prev, { id, variant, message, duration }]);
      const timer = setTimeout(() => removeSnackbar(id), duration);
      timers.current.set(id, timer);
      return id;
    },
    [removeSnackbar],
  );

  const clearAll = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    setSnackbars([]);
  }, []);

  const show = useCallback((message: string) => addSnackbar("DEFAULT", message), [addSnackbar]);
  const success = useCallback((message: string) => addSnackbar("SUCCESS", message), [addSnackbar]);
  const error = useCallback((message: string) => addSnackbar("DANGER", message), [addSnackbar]);

  return { snackbars, addSnackbar, removeSnackbar, clearAll, show, success, error };
}
