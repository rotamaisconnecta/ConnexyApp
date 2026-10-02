import { Trash2 } from "lucide-react";

export function ChatConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Excluir",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end bg-black/35 p-3 backdrop-blur-[1px] sm:items-center sm:justify-center">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="chat-confirm-title"
        className="w-full max-w-sm rounded-[28px] bg-surface p-5 shadow-elegant"
      >
        <h2 id="chat-confirm-title" className="font-display text-lg font-bold">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-full bg-secondary text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-destructive text-sm font-semibold text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
