import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Wifi } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useConnections } from "@/hooks/use-connections";
import { useConnectionPresence } from "@/hooks/use-connection-presence";
import { useUserPresenceControl } from "@/hooks/use-user-presence-control";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";

function formatTimeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

interface OnlineConnection {
  id: string;
  name: string;
  photo_url: string | null;
  status: string;
  last_seen_at: string;
}

export function PresenceLiveFeedReal() {
  const { user } = useAuth();
  const { preference } = useUserPresenceControl(user?.id ?? null);
  const { connections, isLoading: connectionsLoading } = useConnections(user?.id ?? null);
  const { presenceByUser, isOnline } = useConnectionPresence(user?.id ?? null, preference);

  const onlineConnections = useMemo<OnlineConnection[]>(() => {
    if (!user) return [];
    return connections
      .filter((conn) => conn.id !== user.id && isOnline(conn.id))
      .map((conn) => {
        const presence = presenceByUser.get(conn.id);
        return {
          id: conn.id,
          name: conn.name,
          photo_url: conn.photo_url,
          status: presence?.status ?? "online",
          last_seen_at: presence?.last_seen_at ?? new Date().toISOString(),
        };
      })
      .sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime());
  }, [user, connections, isOnline, presenceByUser]);

  if (!isPublicSupabaseConfigured()) return null;

  if (connectionsLoading) {
    return (
      <section className="px-4">
        <div className="rounded-2xl bg-surface shadow-soft p-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (onlineConnections.length === 0) {
    return (
      <section className="px-4">
        <div className="rounded-2xl bg-surface shadow-soft p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-sm font-bold text-foreground">Conexões online</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Seus amigos conectados aparecerão aqui quando estiverem ao vivo.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4">
      <div className="rounded-2xl bg-surface shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-500" />
            <h3 className="font-display text-sm font-bold text-foreground">Conexões online</h3>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            {onlineConnections.length} conectada{onlineConnections.length !== 1 ? "s" : ""}
          </span>
        </div>

        <ul className="divide-y divide-border">
          {onlineConnections.slice(0, 5).map((person, index) => (
            <motion.li
              key={person.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to="/perfil/$id"
                params={{ id: person.id }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="relative shrink-0">
                  {person.photo_url ? (
                    <img
                      src={person.photo_url}
                      alt={person.name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-surface" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{person.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {person.status === "online"
                      ? "Online"
                      : person.status === "available"
                        ? "Disponível agora"
                        : "Não perturbe"}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                  {formatTimeAgo(person.last_seen_at)}
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>

        {onlineConnections.length > 5 && (
          <div className="border-t border-border px-4 py-2.5">
            <p className="text-[10px] text-muted-foreground">
              +{onlineConnections.length - 5} mais conectada
              {onlineConnections.length - 5 !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
