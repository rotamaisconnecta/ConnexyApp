import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Smartphone, Instagram, Link, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getShareOptions,
  getShareLabel,
  getShareColor,
  getReelShareUrl,
  getReelWhatsAppUrl,
  buildReelShareMessage,
} from "@/lib/reels/reel-share";
import { findReelById } from "@/lib/reels/reel-mocks";
import { supportsNativeShare } from "@/lib/share/share-connexy";
import type { ShareTargetValue } from "@/lib/reels/reel-types";
import { ShareTarget } from "@/lib/reels/reel-types";

interface ReelShareSheetProps {
  reelId: string;
  open: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<ShareTargetValue, React.ComponentType<{ className?: string }>> = {
  CHAT: MessageCircle,
  WHATSAPP: Smartphone,
  INSTAGRAM: Instagram,
  COPY_LINK: Link,
  OTHER: MessageCircle,
};

async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    return false;
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function ReelShareSheet({ reelId, open, onClose }: ReelShareSheetProps) {
  const options = getShareOptions();
  const caption = findReelById(reelId)?.caption;

  function notifyCopied(success: boolean, message: string) {
    if (success) toast.success(message);
    else toast.error("Não foi possível copiar o link");
  }

  function handleShare(target: ShareTargetValue) {
    const url = getReelShareUrl(reelId);
    const text = buildReelShareMessage(caption, reelId);

    switch (target) {
      case ShareTarget.WHATSAPP:
        window.open(getReelWhatsAppUrl(reelId, caption), "_blank", "noopener,noreferrer");
        toast.success("Abrindo WhatsApp…");
        break;
      case ShareTarget.COPY_LINK:
        void copyText(text).then((ok) => notifyCopied(ok, "Link copiado!"));
        break;
      case ShareTarget.INSTAGRAM:
        void copyText(text).then((ok) => notifyCopied(ok, "Link copiado — cole no seu story"));
        break;
      case ShareTarget.CHAT:
        void copyText(text).then((ok) => notifyCopied(ok, "Link copiado — cole na conversa"));
        break;
      default:
        if (supportsNativeShare()) {
          navigator.share({ title: "Connexy", text, url }).catch(() => undefined);
        } else {
          void copyText(text).then((ok) => notifyCopied(ok, "Link copiado!"));
        }
        break;
    }
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-surface p-6 pb-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-semibold text-foreground">Partilhar reel</h3>
              <button
                onClick={onClose}
                className="h-8 w-8 grid place-items-center rounded-full bg-secondary"
                aria-label="Fechar"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {options.map((opt) => {
                const Icon = ICON_MAP[opt.target];
                return (
                  <button
                    key={opt.target}
                    onClick={() => handleShare(opt.target)}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="h-14 w-14 grid place-items-center rounded-full bg-secondary transition-colors hover:bg-border">
                      {Icon && <Icon className={cn("h-6 w-6", getShareColor(opt.target))} />}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {getShareLabel(opt.target)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">Reel: {reelId}</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
