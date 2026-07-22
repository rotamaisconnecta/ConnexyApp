import { useState, useCallback } from 'react';
import { DiscoveryService } from '@/services/discovery-service';

export function useDiscovery() {
  const [people, setPeople] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [compatibility, setCompatibility] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await DiscoveryService.getPeople();
      setPeople(result);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendRequest = useCallback(async (targetUserId: string) => {
    setIsLoading(true);
    try {
      const result = await DiscoveryService.sendRequest(targetUserId);
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
