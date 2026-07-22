import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useBottomSheet } from "@/hooks/system/use-bottom-sheet";

interface BottomSheetContextValue {
  isOpen: boolean;
  snap: "HALF" | "FULL";
  open: (snap?: "HALF" | "FULL") => void;
  close: () => void;
  toggle: () => void;
  setSnap: (snap: "HALF" | "FULL") => void;
}

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export function useBottomSheetContext(): BottomSheetContextValue {
  const ctx = useContext(BottomSheetContext);
  if (!ctx) throw new Error("useBottomSheetContext must be used within BottomSheetProvider");
  return ctx;
}

interface BottomSheetProviderProps {
  children: ReactNode;
}

export function BottomSheetProvider({ children }: BottomSheetProviderProps) {
  const sheet = useBottomSheet();

  return <BottomSheetContext.Provider value={sheet}>{children}</BottomSheetContext.Provider>;
}
