import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Colors, Radius, Shadows } from "@/lib/branding/brand-config";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
}

export function Drawer({ isOpen, onClose, children, side = "right", className }: DrawerProps) {
  const initialX = side === "left" ? "-100%" : "100%";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div className="absolute inset-0 bg-black/40" onClick={onClose} />

          <motion.div
            className={cn(
              "absolute top-0 h-full w-[80vw] max-w-sm overflow-y-auto p-6",
              side === "left" ? "left-0" : "right-0",
              className,
            )}
            style={{
              borderRadius:
                side === "left" ? `0 ${Radius.lg} ${Radius.lg} 0` : `${Radius.lg} 0 0 ${Radius.lg}`,
              backgroundColor: Colors.card,
              boxShadow: Shadows.large,
            }}
            initial={{ x: initialX }}
            animate={{
              x: 0,
              transition: { type: "spring", damping: 30, stiffness: 300 },
            }}
            exit={{
              x: initialX,
              transition: { type: "spring", damping: 35, stiffness: 300 },
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
