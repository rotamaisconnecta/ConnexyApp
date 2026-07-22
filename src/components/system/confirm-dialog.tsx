import { Colors, Gradients, Radius, Shadows } from "@/lib/branding/brand-config";
import { Modal } from "./modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="SM">
      <div className="flex flex-col gap-4">
        <span className="text-base font-semibold" style={{ color: Colors.text.primary }}>
          {title}
        </span>
        <span className="text-sm" style={{ color: Colors.text.secondary }}>
          {message}
        </span>
        <div className="flex items-center justify-end gap-3 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium"
            style={{
              borderRadius: Radius.sm,
              color: Colors.text.secondary,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white"
            style={{
              borderRadius: Radius.sm,
              background: danger
                ? `linear-gradient(135deg, ${Colors.danger}, #DC2626)`
                : Gradients.primary,
              boxShadow: danger ? "0 4px 16px rgba(239, 68, 68, 0.35)" : Shadows.floatingButton,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
