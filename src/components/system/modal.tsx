import type { ReactNode } from "react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Colors, Radius, Shadows } from "@/lib/branding/brand-config";
import { modalIn } from "@/lib/system/animation-utils";
import { getModalSizeClass } from "@/lib/system/dialog-utils";
import { ModalSize } from "@/lib/system/system-types";
import type { ModalSizeValue } from "@/lib/system/system-types";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSizeValue;
  title?: string;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  size = ModalSize.MD,
  title,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const sizeClass = getModalSizeClass(size);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className={cn("relative mx-auto w-full p-6", sizeClass, className)}
            style={{
              borderRadius: Radius.lg,
              backgroundColor: Colors.card,
              boxShadow: Shadows.large,
            }}
            initial={modalIn.initial}
            animate={modalIn.animate}
            exit={modalIn.exit}
            transition={modalIn.transition}
          >
            {title && (
              <div className="mb-4">
                <span className="text-lg font-semibold" style={{ color: Colors.text.primary }}>
                  {title}
                </span>
              </div>
            )}

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
