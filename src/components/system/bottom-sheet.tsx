import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Colors, Radius, Shadows } from "@/lib/branding/brand-config";
import { springSheet } from "@/lib/system/animation-utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  snap?: "HALF" | "FULL";
  title?: string;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  snap = "HALF",
  title,
  className,
}: BottomSheetProps) {
  const height = snap === "HALF" ? "50vh" : "85vh";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div className="absolute inset-0 bg-black/40" onClick={onClose} />

          <motion.div
            className={cn("relative bottom-0 w-full overflow-hidden", className)}
            style={{
              height,
              borderTopLeftRadius: Radius.xl,
              borderTopRightRadius: Radius.xl,
              boxShadow: Shadows.large,
            }}
            initial={springSheet.initial}
            animate={springSheet.animate}
            exit={springSheet.exit}
          >
            <div className="flex w-full justify-center pt-3 pb-2" onClick={onClose}>
              <div className="h-1 w-10 rounded-full" style={{ backgroundColor: Colors.border }} />
            </div>

            {title && (
              <div className="px-6 pb-4">
                <span className="text-base font-semibold" style={{ color: Colors.text.primary }}>
                  {title}
                </span>
              </div>
            )}

            <div className="overflow-y-auto px-6 pb-8">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
