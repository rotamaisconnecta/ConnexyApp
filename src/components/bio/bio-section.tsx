import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";

export function BioSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="px-4 mt-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3 shadow-soft transition-colors hover:bg-accent/20"
        aria-expanded={expanded}
      >
        <span className="h-8 w-8 grid place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="flex-1 text-left text-sm font-bold">{title}</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 rounded-2xl border border-border bg-surface p-4 shadow-soft"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}
