import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Share2, Copy, Check, MessageCircle, Link } from "lucide-react";

interface ShareTripProps {
  tripId: string;
  driverName: string;
  origin: string;
  destination: string;
  eta: string;
  onShare?: (method: string) => void;
}

export function ShareTrip({
  tripId,
  driverName,
  origin,
  destination,
  eta,
  onShare,
}: ShareTripProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `Estou indo de ${origin} para ${destination} com ${driverName} via RotaMais. ETA: ${eta}`;

  function handleCopy() {
    navigator.clipboard?.writeText(shareText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-surface p-4 space-y-3"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <Share2 className="h-3.5 w-3.5" />
        Compartilhar viagem
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{shareText}</p>

      <div className="flex gap-2">
        <button
          onClick={() => onShare?.("whatsapp")}
          className="flex-1 h-10 grid place-items-center rounded-xl bg-success/15 text-success gap-1.5"
          aria-label="Compartilhar via WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-[11px] font-medium">WhatsApp</span>
        </button>

        <button
          onClick={handleCopy}
          className="flex-1 h-10 grid place-items-center rounded-xl bg-secondary gap-1.5"
          aria-label="Copiar link"
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          <span className="text-[11px] font-medium">{copied ? "Copiado!" : "Copiar"}</span>
        </button>

        <button
          onClick={() => onShare?.("link")}
          className="h-10 w-10 grid place-items-center rounded-xl bg-secondary shrink-0"
          aria-label="Compartilhar link"
        >
          <Link className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
