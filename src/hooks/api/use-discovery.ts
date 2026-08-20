import { useState, useCallback } from "react";
import { DiscoveryService } from "@/services/discovery.service";

export function useDiscovery() {
  const [people, setPeople] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [compatibility, setCompatibility] = useState<unknown>(null);

  const refresh = useCallback(async (radiusKm = 25, limit = 50) => {
    setIsLoading(true);
    try {
      const result = await DiscoveryService.getNearbyPeople(radiusKm, limit);
      setPeople(result ?? []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendRequest = useCallback(async (receiverId: string) => {
    setIsLoading(true);
    try {
      const result = await DiscoveryService.sendConnectionRequest(receiverId);
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
