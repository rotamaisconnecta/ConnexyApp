import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface RoleActivationModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  ctaLabel: string;
  ctaRoute: string;
}

export function RoleActivationModal({
  open,
  onClose,
  title,
  description,
  ctaLabel,
  ctaRoute,
}: RoleActivationModalProps) {
  const nav = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[320px]"
          >
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div />
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 w-8 grid place-items-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="font-display font-bold text-lg">{title}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  nav({ to: ctaRoute });
                }}
                className={cn(
                  "w-full py-3 rounded-2xl text-sm font-semibold text-white",
                  "bg-gradient-brand shadow-soft active:scale-[0.98] transition-transform",
                )}
              >
                {ctaLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
