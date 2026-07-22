import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DriverBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
} as const;

const sheetVariants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { type: "spring" as const, damping: 30, stiffness: 300 },
  },
  exit: {
    y: "100%",
    transition: { type: "spring" as const, damping: 35, stiffness: 300 },
  },
};

export function DriverBottomSheet({ isOpen, onClose, children }: DriverBottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-[36px] max-h-[80vh] overflow-hidden"
            style={{
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <div className="flex h-full flex-col">
              <div className="shrink-0 px-6 pt-3 pb-2">
                <div className="flex justify-center pb-2">
                  <div className="h-1 w-10 rounded-full bg-border" />
                </div>
              </div>

              <div className="overflow-y-auto overscroll-contain scroll-smooth pb-10 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
