import { motion } from "framer-motion";
import { Clock, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePresence } from "@/providers/presence/presence-provider";
import { visibilityTypeLabel } from "@/lib/presence/presence-privacy";

interface PresentListProps {
  targetId: string;
  title?: string;
  maxItems?: number;
}

function formatCheckinTime(iso: string): string {
  const date = new Date(iso);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function PresentList({ targetId, title = "Presentes", maxItems = 12 }: PresentListProps) {
  const { getPresentList } = usePresence();
  const { visible, anonymousCount } = getPresentList(targetId);
  const shown = visible.slice(0, maxItems);

  return (
    <div className="rounded-2xl bg-surface shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-display text-sm font-bold text-foreground">{title}</h3>
        <span className="text-[11px] text-muted-foreground">
          {visible.length + anonymousCount} pessoas
        </span>
      </div>

      <div className="max-h-[280px] overflow-y-auto no-scrollbar">
        {shown.length === 0 && anonymousCount === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            Ninguém fez check-in ainda.
          </p>
        ) : (
          <motion.ul
            variants={container}
            initial="hidden"
            animate="show"
            className="divide-y divide-border"
          >
            {shown.map((record) => (
              <motion.li
                key={record.id}
                variants={item}
                className="flex items-center gap-3 px-4 py-3"
              >
                <img
                  src={record.userPhoto}
                  alt={record.userName}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {record.userName}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>Check-in {formatCheckinTime(record.checkedInAt)}</span>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                    record.visibility === "PUBLIC"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-blue-50 text-blue-700",
                  )}
                >
                  {visibilityTypeLabel(record.visibility)}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        )}

        {anonymousCount > 0 && (
          <div className="flex items-center gap-3 border-t border-border px-4 py-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted-foreground/15">
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-muted-foreground">
                {anonymousCount} usuário{anonymousCount > 1 ? "s" : ""} anônimo
                {anonymousCount > 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-muted-foreground/80">
                Presença privada — nome não exibido
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-muted-foreground/10 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              🙈 Anônimo
            </span>
          </div>
        )}

        {visible.length > maxItems && (
          <p className="px-4 py-2 text-center text-[11px] text-muted-foreground">
            +{visible.length - maxItems} outros
          </p>
        )}
      </div>
    </div>
  );
}
