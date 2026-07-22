import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useModal } from "@/hooks/system/use-modal";

interface DialogContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialogContext(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialogContext must be used within DialogProvider");
  return ctx;
}

interface DialogProviderProps {
  children: ReactNode;
}

export function DialogProvider({ children }: DialogProviderProps) {
  const modal = useModal();

  return <DialogContext.Provider value={modal}>{children}</DialogContext.Provider>;
}
