import { useState, useEffect, useCallback } from "react";

interface UseOfflineReturn {
  isOffline: boolean;
  isOnline: boolean;
  lastOnline: Date | null;
  retry: () => void;
}

export function useOffline(): UseOfflineReturn {
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof navigator !== "undefined") return !navigator.onLine;
    return false;
  });
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setLastOnline(new Date());
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const retry = useCallback(() => {
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }
  }, []);

  return { isOffline, isOnline: !isOffline, lastOnline, retry };
}
