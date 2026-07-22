import { useState, useCallback, useRef } from "react";
import type { ToastData, ToastVariantValue } from "@/lib/system/system-types";
import { getDefaultDuration, generateToastId } from "@/lib/system/toast-utils";

interface UseToastReturn {
  toasts: ToastData[];
  addToast: (
    variant: ToastVariantValue,
    title: string,
    description?: string,
    duration?: number,
  ) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  success: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  danger: (title: string, description?: string) => string;
  loading: (title: string, description?: string) => string;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (
      variant: ToastVariantValue,
      title: string,
      description?: string,
      duration?: number,
    ): string => {
      const id = generateToastId();
      const dur = duration ?? getDefaultDuration(variant);

      setToasts((prev) => [...prev, { id, variant, title, description, duration: dur }]);

      if (dur !== Infinity) {
        const timer = setTimeout(() => removeToast(id), dur);
        timers.current.set(id, timer);
      }

      return id;
    },
    [removeToast],
  );

  const clearAll = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
    setToasts([]);
  }, []);

  const success = useCallback(
    (title: string, desc?: string) => addToast("SUCCESS", title, desc),
    [addToast],
  );
  const warning = useCallback(
    (title: string, desc?: string) => addToast("WARNING", title, desc),
    [addToast],
  );
  const info = useCallback(
    (title: string, desc?: string) => addToast("INFO", title, desc),
    [addToast],
  );
  const danger = useCallback(
    (title: string, desc?: string) => addToast("DANGER", title, desc),
    [addToast],
  );
  const loading = useCallback(
    (title: string, desc?: string) => addToast("LOADING", title, desc),
    [addToast],
  );

  return { toasts, addToast, removeToast, clearAll, success, warning, info, danger, loading };
}
