import { useState, useCallback } from "react";
import { DiscoveryService } from "@/services/discovery.service";

export function useDiscovery() {
  const [people, setPeople] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [compatibility, setCompatibility] = useState<unknown>(null);

  const refresh = useCallback(async (userId: string, lat: number, lng: number, radius: number) => {
    setIsLoading(true);
    try {
      const result = await DiscoveryService.getNearbyPeople(userId, lat, lng, radius);
      setPeople(result ?? []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendRequest = useCallback(async (fromId: string, toId: string) => {
    setIsLoading(true);
    try {
      const result = await DiscoveryService.sendConnectionRequest(fromId, toId);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    people,
    isLoading,
    compatibility,
    sendRequest,
    refresh,
  };
}
