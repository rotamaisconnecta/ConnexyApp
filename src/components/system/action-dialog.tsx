import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Colors, Radius } from "@/lib/branding/brand-config";
import { Modal } from "./modal";

interface ActionItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  destructive?: boolean;
}

interface ActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actions: ActionItem[];
  onAction: (id: string) => void;
}

export function ActionDialog({ isOpen, onClose, title, actions, onAction }: ActionDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="SM" title={title}>
      <div className="flex flex-col gap-1">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              onAction(action.id);
              onClose();
            }}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-medium",
              "transition-colors",
            )}
            style={{
              borderRadius: Radius.sm,
              color: action.destructive ? Colors.danger : Colors.text.primary,
            }}
          >
            {action.icon && (
              <span className="flex-shrink-0">
                <action.icon className="h-5 w-5" />
              </span>
            )}
            {action.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
