export type CurrentLocationShare = {
  label: string;
  proximity: string;
  lat: number;
  lng: number;
};

export function isValidCoordinates(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export function formatCoordinatePair(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function formatCurrentLocationShare(input: {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}): CurrentLocationShare | null {
  if (!isValidCoordinates(input.latitude, input.longitude)) return null;
  const accuracy =
    input.accuracy != null && Number.isFinite(input.accuracy) && input.accuracy > 0
      ? Math.round(input.accuracy)
      : null;
  return {
    label: "Minha localização",
    proximity:
      accuracy != null
        ? `${formatCoordinatePair(input.latitude, input.longitude)} · precisão de ${accuracy} m`
        : formatCoordinatePair(input.latitude, input.longitude),
    lat: input.latitude,
    lng: input.longitude,
  };
}
