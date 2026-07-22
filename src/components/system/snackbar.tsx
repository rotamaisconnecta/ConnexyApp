import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { snackbarIn } from "@/lib/system/animation-utils";
import type { SnackbarData, SnackbarVariantValue } from "@/lib/system/system-types";
import { Colors, Radius, Shadows } from "@/lib/branding/brand-config";

const variantStyles: Record<SnackbarVariantValue, { bg: string; border: string; text: string }> = {
  DEFAULT: {
    bg: Colors.text.primary,
    border: "transparent",
    text: Colors.background,
  },
  SUCCESS: {
    bg: Colors.success,
    border: "transparent",
    text: Colors.background,
  },
  DANGER: {
    bg: Colors.danger,
    border: "transparent",
    text: Colors.background,
  },
};

interface SnackbarContainerProps {
  snackbars: SnackbarData[];
  onDismiss: (id: string) => void;
}

export function SnackbarContainer({ snackbars, onDismiss }: SnackbarContainerProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 items-center pointer-events-none">
      <AnimatePresence mode="popLayout">
        {snackbars.map((snackbar) => {
          const styles = variantStyles[snackbar.variant];

          return (
            <motion.div
              key={snackbar.id}
              layout
              initial={snackbarIn.initial}
              animate={snackbarIn.animate}
              exit={snackbarIn.exit}
              transition={snackbarIn.transition}
              className={cn(
                "pointer-events-auto flex items-center gap-3 px-5 py-3 min-w-[280px] max-w-[480px]",
                "backdrop-blur-xl border",
              )}
              style={{
                borderRadius: Radius.md,
                background: styles.bg,
                borderColor: styles.border,
                color: styles.text,
                boxShadow: Shadows.large,
              }}
            >
              <span className="flex-1 text-sm font-medium">{snackbar.message}</span>
              {snackbar.action && (
                <button
                  onClick={snackbar.action.onClick}
                  className="text-xs font-bold px-3 py-1 rounded-full transition-opacity hover:opacity-80 flex-shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: Radius.floating,
                  }}
                >
                  {snackbar.action.label}
                </button>
              )}
              <button
                onClick={() => onDismiss(snackbar.id)}
                className="text-xs opacity-60 hover:opacity-100 transition-opacity p-1 flex-shrink-0"
              >
                ✕
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
