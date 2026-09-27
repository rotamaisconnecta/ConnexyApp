export type DiscoverMapItemType = "todos" | "pessoas" | "eventos" | "negocios" | "locais";

export type DiscoverItemRef = {
  id: string;
  type: DiscoverMapItemType;
  targetId?: string;
};

export type DiscoverDetailTarget =
  | { to: "/perfil/$id"; params: { id: string } }
  | { to: "/local/$id"; params: { id: string } }
  | { to: "/event/$eventId"; params: { eventId: string } }
  | { to: "/business/$businessId"; params: { businessId: string } };

export function discoverEventIdFromItem(item: DiscoverItemRef): string {
  return item.targetId ?? item.id.replace(/^evt-/, "");
}

export function getDiscoverItemNavigation(item: DiscoverItemRef): DiscoverDetailTarget | null {
  if (item.type === "pessoas") {
    if (!item.targetId) return null;
    return { to: "/perfil/$id", params: { id: item.targetId } };
  }
  if (item.type === "locais") {
    return { to: "/local/$id", params: { id: item.id } };
  }
  if (item.type === "negocios") {
    if (item.targetId) {
      return { to: "/business/$businessId", params: { businessId: item.targetId } };
    }
    return { to: "/local/$id", params: { id: item.id.replace(/^biz-/, "") } };
  }
  if (item.type === "eventos") {
    return { to: "/event/$eventId", params: { eventId: discoverEventIdFromItem(item) } };
  }
  return null;
}
