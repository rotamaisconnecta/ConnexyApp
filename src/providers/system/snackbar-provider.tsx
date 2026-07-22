import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useSnackbar } from "@/hooks/system/use-snackbar";
import type { SnackbarData, SnackbarVariantValue } from "@/lib/system/system-types";

interface SnackbarContextValue {
  snackbars: SnackbarData[];
  addSnackbar: (variant: SnackbarVariantValue, message: string, duration?: number) => string;
  removeSnackbar: (id: string) => void;
  clearAll: () => void;
  show: (message: string) => string;
  success: (message: string) => string;
  error: (message: string) => string;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function useSnackbarContext(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbarContext must be used within SnackbarProvider");
  return ctx;
}

interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const snackbar = useSnackbar();

  return <SnackbarContext.Provider value={snackbar}>{children}</SnackbarContext.Provider>;
}
