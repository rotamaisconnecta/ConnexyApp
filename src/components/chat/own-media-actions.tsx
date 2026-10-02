import { Download, Trash2 } from "lucide-react";
import { IconConfig } from "@/theme";

export function OwnMediaHoverActions({
  onDownload,
  onDelete,
}: {
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center bg-gradient-to-t from-black/50 to-transparent px-2 pb-1.5 pt-7 opacity-0 transition-opacity duration-150 group-hover/media:!pointer-events-auto group-hover/media:!opacity-100 [@media(hover:none)]:hidden">
      <div
        data-chat-media-action=""
        className="flex items-center rounded-full border border-white/20 bg-black/40 p-0.5 shadow-[0_8px_20px_rgba(0,0,0,0.22)] backdrop-blur-xl"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Baixar"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDownload();
          }}
          className="inline-flex h-8 min-w-[4.75rem] items-center justify-center gap-1 rounded-full px-2.5 text-[11px] font-semibold text-white/95 transition active:scale-[0.97]"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={IconConfig.strokeWidth.regular} />
          Baixar
        </button>
        <button
          type="button"
          aria-label="Excluir"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete();
          }}
          className="inline-flex h-8 min-w-[4.75rem] items-center justify-center gap-1 rounded-full px-2.5 text-[11px] font-semibold text-red-200 transition active:scale-[0.97]"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={IconConfig.strokeWidth.regular} />
          Excluir
        </button>
      </div>
    </div>
  );
}
