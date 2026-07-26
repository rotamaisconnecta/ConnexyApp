import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { RoleDefinition } from "@/lib/roles/roles-types";

interface RoleCardProps {
  definition: RoleDefinition;
  active: boolean;
  onToggle: () => void;
}

export function RoleCard({ definition, active, onToggle }: RoleCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 transition-all duration-200",
        active
          ? "border-primary/30 bg-primary/5 shadow-soft"
          : "border-border bg-surface shadow-soft hover:shadow-elevated",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ backgroundColor: `${definition.color}15` }}
        >
          {definition.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold truncate">{definition.title}</h3>
            {active && <span className="shrink-0 h-2 w-2 rounded-full bg-green-500" />}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {definition.description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "mt-3 w-full py-2 rounded-xl text-xs font-semibold transition-colors",
          active
            ? "bg-secondary text-muted-foreground hover:bg-secondary/80"
            : "bg-gradient-brand text-white shadow-soft",
        )}
      >
        {active ? "Desativar" : "Ativar"}
      </button>
    </motion.div>
  );
}
