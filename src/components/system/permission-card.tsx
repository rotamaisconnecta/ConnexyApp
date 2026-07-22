import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Colors, Gradients, Radius, Shadows } from "@/lib/branding/brand-config";

interface PermissionCardProps {
  title: string;
  description: string;
  status: "GRANTED" | "DENIED" | "PROMPT" | "UNAVAILABLE";
  onRequest?: () => void;
  icon?: ComponentType<{ className?: string }>;
}

const STATUS_CONFIG = {
  GRANTED: {
    label: "Granted",
    bg: "#DCFCE7",
    color: Colors.success,
  },
  DENIED: {
    label: "Denied",
    bg: "#FEE2E2",
    color: Colors.danger,
  },
  PROMPT: {
    label: "Pending",
    bg: "#FEF3C7",
    color: Colors.warning,
  },
  UNAVAILABLE: {
    label: "Unavailable",
    bg: Colors.surface,
    color: Colors.text.secondary,
  },
} as const;

export function PermissionCard({
  title,
  description,
  status,
  onRequest,
  icon: Icon,
}: PermissionCardProps) {
  const statusConfig = STATUS_CONFIG[status];

  return (
    <div
      className="flex items-start gap-4 p-4"
      style={{
        borderRadius: Radius.md,
        backgroundColor: Colors.card,
        boxShadow: Shadows.soft,
      }}
    >
      {Icon && (
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: Colors.surface }}
        >
          <Icon className="h-5 w-5" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: Colors.text.primary }}>
            {title}
          </span>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: statusConfig.bg,
              color: statusConfig.color,
            }}
          >
            {statusConfig.label}
          </span>
        </div>
        <span className="mt-1 block text-xs" style={{ color: Colors.text.secondary }}>
          {description}
        </span>
      </div>

      {status !== "GRANTED" && status !== "UNAVAILABLE" && onRequest && (
        <button
          onClick={onRequest}
          className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-white"
          style={{
            borderRadius: Radius.floating,
            background: Gradients.primary,
            boxShadow: Shadows.floatingButton,
          }}
        >
          {status === "PROMPT" ? "Grant" : "Request"}
        </button>
      )}
    </div>
  );
}
