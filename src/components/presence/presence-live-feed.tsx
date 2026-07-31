import { motion } from "framer-motion";
import { MapPin, EyeOff } from "lucide-react";
import { usePresence } from "@/providers/presence/presence-provider";

function formatTimeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

export function PresenceLiveFeed() {
  const { feedItems, checkins } = usePresence();

  if (feedItems.length === 0) return null;

  const anonymousCount = checkins.filter((r) => r.visibility === "ANONYMOUS" && !r.leftAt).length;

  return (
    <section className="px-4">
      <div className="rounded-2xl bg-surface shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-display text-sm font-bold text-foreground">Presença ao vivo</h3>
          <span className="text-[10px] font-medium text-muted-foreground">
            {anonymousCount > 0
              ? `🙈 ${anonymousCount} presença${anonymousCount > 1 ? "s" : ""} anônima${anonymousCount > 1 ? "s" : ""} não listada${anonymousCount > 1 ? "s" : ""}`
              : "atualização em tempo real"}
          </span>
        </div>

        <ul className="divide-y divide-border">
          {feedItems.slice(0, 5).map((item, index) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
              <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                {formatTimeAgo(item.timestamp)}
              </span>
            </motion.li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 border-t border-border px-4 py-2.5">
          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">
            Presenças anônimas contam para o movimento, mas nunca aparecem no feed.
          </p>
        </div>
      </div>
    </section>
  );
}
