import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CreateOptionCardProps {
  title: string;
  description: string;
  featured?: boolean;
  locked?: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
}

export function CreateOptionCard({
  title,
  description,
  featured = false,
  locked = false,
  onClick,
  ariaLabel,
  children,
}: CreateOptionCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: locked ? 1 : 1.01 }}
      whileTap={{ scale: locked ? 0.98 : 0.97 }}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-disabled={locked || undefined}
      className={cn(
        "relative overflow-hidden rounded-[28px] bg-surface text-left shadow-[0_10px_28px_rgba(24,24,43,0.08)] outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        featured ? "col-span-2 min-h-[172px]" : "min-h-[164px]",
      )}
      style={{ opacity: locked ? 0.6 : 1 }}
    >
      <div className="absolute inset-0" aria-hidden>
        {children}
      </div>

      <div
        className="absolute inset-x-3 bottom-3 rounded-[20px] border border-white/45 bg-white/72 p-3 shadow-[0_8px_24px_rgba(15,18,35,0.10)] backdrop-blur-xl"
      >
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "min-w-0 font-display font-semibold leading-snug tracking-tight text-zinc-950",
              featured ? "text-[17px]" : "text-[15px]",
            )}
          >
            {title}
          </span>
          {locked ? <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-700" /> : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-700">{description}</p>
      </div>
    </motion.button>
  );
}
