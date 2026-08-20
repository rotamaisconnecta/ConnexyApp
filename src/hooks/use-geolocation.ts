import { useCallback, useEffect, useRef, useState } from "react";

export type GeolocationPermission = "prompt" | "granted" | "denied" | "unavailable";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  permission: GeolocationPermission;
  isLoading: boolean;
  error: string | null;
}

export function useGeolocation(options?: { enableHighAccuracy?: boolean }) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    permission: "prompt",
    isLoading: false,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, permission: "unavailable", error: "Geolocalização indisponível" }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current) return;
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          permission: "granted",
          isLoading: false,
          error: null,
        });
      },
      (err) => {
        if (!mountedRef.current) return;
        const permission: GeolocationPermission =
          err.code === GeolocationPositionError.PERMISSION_DENIED ? "denied" : "prompt";
        setState((s) => ({
          ...s,
          permission,
          isLoading: false,
          error:
            err.code === GeolocationPositionError.PERMISSION_DENIED
              ? "Permissão de localização negada"
              : "Não foi possível obter sua localização",
        }));
      },
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  }, [options?.enableHighAccuracy]);

  const watch = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    stopWatching();

    const id = navigator.geolocation.watchPosition(
      (position) => {
        if (!mountedRef.current) return;
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          permission: "granted",
          isLoading: false,
          error: null,
        });
      },
      () => {},
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: 15000,
        maximumAge: 30000,
      },
    );
    watchIdRef.current = id;
  }, [options?.enableHighAccuracy, stopWatching]);

  useEffect(() => {
    return () => stopWatching();
  }, [stopWatching]);

  return { ...state, request, watch, stopWatching };
}
