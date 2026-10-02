import type { PresenceRecord } from "@/lib/event-checkin/checkin-types";
import { findPlace } from "@/lib/mock-data";
import { resolveLocalEventById } from "@/lib/marketplace/local-event-lookup";
import { CatalogKind, listCatalogByKind } from "@/lib/catalog/local-catalog";

export type ShareableCheckinItem = {
  id: string;
  kind: "event" | "place";
  title: string;
  cover?: string;
  location?: string;
  dateText?: string;
  proximity: string;
  route: string;
  checkedInAt: string;
};

function formatCheckinDate(iso: string): string | undefined {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function enrichPlace(record: PresenceRecord): ShareableCheckinItem {
  const place = findPlace(record.targetId);
  const catalog = listCatalogByKind(CatalogKind.PLACE).find((item) => item.id === record.targetId);
  return {
    id: record.targetId,
    kind: "place",
    title: place?.name ?? catalog?.name ?? record.targetName,
    cover: place?.cover ?? catalog?.cover,
    location: place?.address ?? catalog?.address,
    dateText: formatCheckinDate(record.checkedInAt),
    proximity: "Você esteve aqui",
    route: `/local/${record.targetId}`,
    checkedInAt: record.checkedInAt,
  };
}

function enrichEvent(record: PresenceRecord): ShareableCheckinItem {
  const event = resolveLocalEventById(record.targetId);
  const catalog = listCatalogByKind(CatalogKind.EVENT).find((item) => item.id === record.targetId);
  const start = event?.startDate ?? (catalog ? new Date(catalog.startAt) : null);
  const dateText =
    start && !Number.isNaN(start.getTime())
      ? start.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : formatCheckinDate(record.checkedInAt);
  return {
    id: record.targetId,
    kind: "event",
    title: event?.title ?? catalog?.title ?? record.targetName,
    cover: event?.photo ?? catalog?.photo,
    location: event?.location ?? catalog?.location,
    dateText,
    proximity: "Você esteve aqui",
    route: `/event/${record.targetId}`,
    checkedInAt: record.checkedInAt,
  };
}

export function listShareableCheckins(
  records: readonly PresenceRecord[],
  userId: string,
): ShareableCheckinItem[] {
  if (!userId) return [];
  const latestByTarget = new Map<string, PresenceRecord>();
  for (const record of records) {
    if (record.userId !== userId || !record.checkedInAt) continue;
    const current = latestByTarget.get(record.targetId);
    if (!current || Date.parse(record.checkedInAt) > Date.parse(current.checkedInAt)) {
      latestByTarget.set(record.targetId, record);
    }
  }
  return [...latestByTarget.values()]
    .sort((a, b) => Date.parse(b.checkedInAt) - Date.parse(a.checkedInAt))
    .map((record) => (record.targetType === "event" ? enrichEvent(record) : enrichPlace(record)));
}
