import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, Info, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toastIn } from "@/lib/system/animation-utils";
import type { ToastData, ToastVariantValue } from "@/lib/system/system-types";
import { Colors, Radius, Shadows } from "@/lib/branding/brand-config";

const variantConfig: Record<
  ToastVariantValue,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  SUCCESS: { icon: CheckCircle, color: Colors.success, bg: "rgba(34,197,94,0.1)" },
  WARNING: { icon: AlertTriangle, color: Colors.warning, bg: "rgba(245,158,11,0.1)" },
  INFO: { icon: Info, color: Colors.brand.primary, bg: "rgba(108,59,255,0.1)" },
  DANGER: { icon: AlertCircle, color: Colors.danger, bg: "rgba(239,68,68,0.1)" },
  LOADING: { icon: Loader2, color: Colors.brand.primary, bg: "rgba(108,59,255,0.1)" },
};

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const config = variantConfig[toast.variant];
          const IconComponent = config.icon;

          return (
            <motion.div
              key={toast.id}
              layout
              initial={toastIn.initial}
              animate={toastIn.animate}
              exit={toastIn.exit}
              transition={toastIn.transition}
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 min-w-[320px] max-w-[420px]",
                "backdrop-blur-xl border",
              )}
              style={{
                borderRadius: Radius.md,
                background: config.bg,
                borderColor: Colors.border,
                boxShadow: Shadows.medium,
              }}
            >
              <span className="mt-0.5 flex-shrink-0" style={{ color: config.color }}>
                <IconComponent
                  className={cn("w-5 h-5", toast.variant === "LOADING" && "animate-spin")}
                />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: Colors.text.primary }}>
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="mt-1 text-xs" style={{ color: Colors.text.secondary }}>
                    {toast.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className="text-xs font-semibold px-3 py-1 rounded-full transition-opacity hover:opacity-80"
                    style={{
                      color: Colors.brand.primary,
                      background: "rgba(108,59,255,0.1)",
                      borderRadius: Radius.floating,
                    }}
                  >
                    {toast.action.label}
                  </button>
                )}
                <button
                  onClick={() => onDismiss(toast.id)}
                  className="text-xs opacity-50 hover:opacity-100 transition-opacity p-1"
                  style={{ color: Colors.text.secondary }}
                >
                  ✕
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
