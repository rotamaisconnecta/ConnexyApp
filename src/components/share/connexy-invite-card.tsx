import { useState } from "react";
import { Link2, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  copyConnexyLink,
  getWhatsAppShareUrl,
  shareConnexy,
  supportsNativeShare,
} from "@/lib/share/share-connexy";

interface ConnexyInviteCardProps {
  compact?: boolean;
  className?: string;
}

export function ConnexyInviteCard({ compact, className }: ConnexyInviteCardProps) {
  const [copied, setCopied] = useState(false);
  const native = supportsNativeShare();

  function handleCopy() {
    copyConnexyLink().then((ok) => {
      if (ok) {
        setCopied(true);
        toast.success("Link copiado! Envie para quem quiser.");
        window.setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error("Não foi possível copiar o link.");
      }
    });
  }

  function handleNative() {
    shareConnexy("native").then((result) => {
      if (result.ok) toast.success("Compartilhamento iniciado");
      else if (!result.canceled) toast.error("Não foi possível compartilhar.");
    });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-soft",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white shadow-floating">
          <Share2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">Convidar para o Connexy</div>
          <div className="text-[11px] text-muted-foreground">Leve amigos para o ecossistema</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={getWhatsAppShareUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-green-600 px-4 text-xs font-semibold text-white transition-all duration-200 hover:bg-green-700 active:scale-[0.98]"
          aria-label="Compartilhar o Connexy pelo WhatsApp"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Compartilhar no WhatsApp
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary/10 px-4 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/20 active:scale-[0.98]"
          aria-label="Copiar link de convite do Connexy"
        >
          <Link2 className="h-3.5 w-3.5" />
          {copied ? "Link copiado!" : "Copiar link"}
        </button>
        {native && (
          <button
            type="button"
            onClick={handleNative}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-secondary px-4 text-xs font-semibold text-foreground transition-all duration-200 hover:bg-accent active:scale-[0.98]"
            aria-label="Compartilhar o Connexy pelo sistema"
          >
            <Share2 className="h-3.5 w-3.5" />
            Compartilhar
          </button>
        )}
      </div>
    </div>
  );
}
