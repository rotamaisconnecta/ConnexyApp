export const CONNECTA_NEARBY_MAX_METERS = 2000;

export type ConnectaListFilter = {
  onlyOnline: boolean;
  onlyNearby: boolean;
};

export function matchesConnectaListFilter(
  person: { online: boolean; distanceMeters: number } | undefined,
  filter: ConnectaListFilter,
): boolean {
  if (!person) return false;
  if (filter.onlyOnline && !person.online) return false;
  if (filter.onlyNearby && person.distanceMeters > CONNECTA_NEARBY_MAX_METERS) return false;
  return true;
}
