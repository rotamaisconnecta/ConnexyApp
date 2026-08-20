import { useCallback, useEffect, useState } from "react";
import { ConnectionsService } from "@/services/connections.service";
import { UserRepository } from "@/repositories/user.repository";
import type { ProfileRow } from "@/types/database/tables";

export interface ConnectedPerson {
  id: string;
  name: string;
  handle: string | null;
  photo_url: string | null;
  headline: string | null;
  conversationId: string | null;
  connectedAt: string;
}

export function useConnections(userId: string | null) {
  const [connections, setConnections] = useState<ConnectedPerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const rows = await ConnectionsService.listConnections();
      const profiles: ConnectedPerson[] = [];

      for (const row of rows) {
        const otherId = row.user_a_id === userId ? row.user_b_id : row.user_a_id;
        try {
          const profile: ProfileRow = await UserRepository.getById(otherId);
          const conversationId = await ConnectionsService.getDirectConversation(otherId);
          profiles.push({
            id: profile.id,
            name: profile.name ?? "Usuario",
            handle: profile.handle,
            photo_url: profile.photo_url,
            headline: profile.headline,
            conversationId,
            connectedAt: row.created_at,
          });
        } catch {
          profiles.push({
            id: otherId,
            name: "Usuario",
            handle: null,
            photo_url: null,
            headline: null,
            conversationId: null,
            connectedAt: row.created_at,
          });
        }
      }

      setConnections(profiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar conexões");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { connections, isLoading, error, refresh, count: connections.length };
}
