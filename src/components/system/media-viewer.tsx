import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Repeat2,
  Share2,
  X,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  type?: "image" | "video";
  alt?: string;
  title?: string;
  position?: number;
  total?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onRepost?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function MediaViewer({
  isOpen,
  onClose,
  src,
  type = "image",
  alt = "",
  title = "Publicação",
  position,
  total,
  onPrevious,
  onNext,
  onRepost,
  isFavorite = false,
  onToggleFavorite,
}: MediaViewerProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrevious?.();
      if (event.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [isOpen, onClose, onNext, onPrevious]);

  useEffect(() => setScale(1), [src, isOpen]);

  const toggleZoom = useCallback(() => {
    if (type === "image") setScale((current) => (current === 1 ? 2 : 1));
  }, [type]);

  const shareMedia = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Veja esta ${title.toLocaleLowerCase("pt-BR")}.`,
          url: src,
        });
      } else {
        await navigator.clipboard.writeText(src);
        toast.success("Link da imagem copiado.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Não foi possível compartilhar esta imagem.");
    }
  }, [src, title]);

  const downloadMedia = useCallback(async () => {
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error("download failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `connexy-${Date.now()}.${blob.type.includes("png") ? "png" : "jpg"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Imagem baixada.");
    } catch {
      window.open(src, "_blank", "noopener,noreferrer");
      toast("A imagem foi aberta para você salvá-la.");
    }
  }, [src]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Visualizando ${title}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col bg-[#08080b]/[0.97] text-white backdrop-blur-xl"
        >
          <header className="relative z-20 flex shrink-0 items-center justify-between px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition active:scale-95"
              aria-label="Fechar imagem"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="min-w-0 text-center">
              <p className="truncate text-sm font-semibold">{title}</p>
              {position != null && total != null && (
                <p className="mt-0.5 text-[11px] text-white/55">
                  {position} de {total}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={toggleZoom}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition active:scale-95"
              aria-label={scale === 1 ? "Ampliar imagem" : "Reduzir imagem"}
            >
              <ZoomIn className="h-5 w-5" />
            </button>
          </header>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            {onPrevious && (
              <button
                type="button"
                onClick={onPrevious}
                className="absolute left-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <motion.div
              className="flex h-full w-full items-center justify-center overflow-auto p-4"
              onClick={toggleZoom}
              style={{
                cursor: type === "image" ? (scale === 1 ? "zoom-in" : "zoom-out") : "default",
              }}
            >
              {type === "video" ? (
                <video
                  src={src}
                  className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={src}
                  alt={alt}
                  draggable={false}
                  className={cn(
                    "max-h-full max-w-full select-none rounded-2xl object-contain shadow-2xl transition-transform duration-300",
                    scale > 1 && "origin-center",
                  )}
                  style={{ transform: `scale(${scale})` }}
                />
              )}
            </motion.div>

            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="absolute right-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          <footer className="relative z-20 shrink-0 border-t border-white/10 bg-black/30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl">
            <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
              <ViewerAction icon={Repeat2} label="Republicar" action={onRepost} />
              <ViewerAction icon={Share2} label="Compartilhar" action={shareMedia} />
              <ViewerAction icon={Download} label="Baixar" action={downloadMedia} />
              <ViewerAction
                icon={Heart}
                label={isFavorite ? "Salva" : "Salvar"}
                action={onToggleFavorite}
                active={isFavorite}
              />
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ViewerAction({
  icon: Icon,
  label,
  action,
  active = false,
}: {
  icon: LucideIcon;
  label: string;
  action?: () => void | Promise<void>;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => void action?.()}
      disabled={!action}
      className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl py-2 text-[10px] font-medium text-white/80 transition active:scale-95 disabled:opacity-35"
    >
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full bg-white/10",
          active && "bg-primary text-white",
        )}
      >
        <Icon className={cn("h-[18px] w-[18px]", active && "fill-current")} />
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
