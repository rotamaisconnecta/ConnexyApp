import { useState, useCallback, useEffect } from "react";
import { DiscoveryService } from "@/services/discovery.service";
import type { NearbyProfile } from "@/types/phase-13b";

export function useDiscovery() {
  const [people, setPeople] = useState<NearbyProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (radiusKm = 25, limit = 50) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await DiscoveryService.getNearbyPeople(radiusKm, limit);
      setPeople(result ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pessoas próximas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendRequest = useCallback(async (receiverId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await DiscoveryService.sendConnectionRequest(receiverId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar convite");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    people,
    isLoading,
    error,
    sendRequest,
    refresh,
  };
}
