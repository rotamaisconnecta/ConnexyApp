import type { ComponentType } from "react";
import { Colors, Gradients, Radius, Shadows } from "@/lib/branding/brand-config";
import { Modal } from "./modal";

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrant: () => void;
  title: string;
  description: string;
  icon?: ComponentType<{ className?: string }>;
}

export function PermissionModal({
  isOpen,
  onClose,
  onGrant,
  title,
  description,
  icon: Icon,
}: PermissionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="SM">
      <div className="flex flex-col items-center gap-4 text-center">
        {Icon && (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: Colors.surface }}
          >
            <Icon className="h-7 w-7" />
          </div>
        )}

        <span className="text-lg font-semibold" style={{ color: Colors.text.primary }}>
          {title}
        </span>

        <span className="text-sm" style={{ color: Colors.text.secondary }}>
          {description}
        </span>

        <button
          onClick={() => {
            onGrant();
            onClose();
          }}
          className="mt-2 w-full px-4 py-3 text-sm font-semibold text-white"
          style={{
            borderRadius: Radius.sm,
            background: Gradients.primary,
            boxShadow: Shadows.floatingButton,
          }}
        >
          Grant Permission
        </button>
      </div>
    </Modal>
  );
}
