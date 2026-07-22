import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useToast } from "@/hooks/system/use-toast";
import type { ToastData, ToastVariantValue } from "@/lib/system/system-types";

interface ToastContextValue {
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

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const toast = useToast();

  return <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>;
}
