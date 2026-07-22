import { useState, useCallback, useRef, useEffect } from "react";

interface UseBottomSheetReturn {
  isOpen: boolean;
  snap: "HALF" | "FULL";
  open: (snap?: "HALF" | "FULL") => void;
  close: () => void;
  toggle: () => void;
  setSnap: (snap: "HALF" | "FULL") => void;
  sheetRef: React.RefObject<HTMLDivElement | null>;
}

export function useBottomSheet(): UseBottomSheetReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [snap, setSnap] = useState<"HALF" | "FULL">("HALF");
  const sheetRef = useRef<HTMLDivElement>(null);

  const open = useCallback((newSnap?: "HALF" | "FULL") => {
    if (newSnap) setSnap(newSnap);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isOpen && typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);

  return { isOpen, snap, open, close, toggle, setSnap, sheetRef };
}
