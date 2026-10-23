import { useState, useCallback, useEffect, useRef } from "react";
import { DiscoveryService } from "@/services/discovery.service";
import type { NearbyProfile } from "@/types/phase-13b";
import { useAuth } from "@/hooks/use-auth";
import { isDemoMode } from "@/lib/demo/demo-config";

export function useDiscovery() {
  const { session, user, loading: authLoading } = useAuth();
  const [people, setPeople] = useState<NearbyProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(null);

  const refresh = useCallback(
    async (radiusKm = 25, limit = 50) => {
      const demo = isDemoMode();
      const requestId = ++requestIdRef.current;
      const requestUserId = user?.id ?? null;
      const isRequestCurrent = () =>
        requestIdRef.current === requestId && (demo || currentUserIdRef.current === requestUserId);

      if (!demo) {
        if (authLoading) {
          setIsLoading(false);
          return;
        }

        if (!session || !requestUserId) {
          setError(null);
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await DiscoveryService.getNearbyPeople(radiusKm, limit);
        if (!isRequestCurrent()) return;
        setPeople(result ?? []);
      } catch (err) {
        if (!isRequestCurrent()) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar pessoas próximas");
      } finally {
        if (isRequestCurrent()) setIsLoading(false);
      }
    },
    [authLoading, session, user?.id],
  );

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
    const currentUserId = user?.id ?? null;
    currentUserIdRef.current = currentUserId;

    if (isDemoMode()) {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      void refresh();
      return;
    }

    if (authLoading) {
      requestIdRef.current += 1;
      hasFetchedRef.current = false;
      setIsLoading(false);
      return;
    }

    if (!session || !currentUserId) {
      requestIdRef.current += 1;
      if (lastUserIdRef.current && lastUserIdRef.current !== currentUserId) {
        setPeople([]);
        setError(null);
      }
      lastUserIdRef.current = currentUserId;
      setIsLoading(false);
      setError(null);
      hasFetchedRef.current = false;
      return;
    }

    if (lastUserIdRef.current !== currentUserId) {
      requestIdRef.current += 1;
      hasFetchedRef.current = false;
      setPeople([]);
      setError(null);
    }
    lastUserIdRef.current = currentUserId;

    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;
    void refresh();
  }, [authLoading, session, user?.id, refresh]);

  return {
    people,
    isLoading,
    error,
    sendRequest,
    refresh,
  };
}
