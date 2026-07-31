/* eslint-disable react-refresh/only-export-components */
/* ==== presence-provider.tsx -- Presence Privacy System Provider
   Phase 10.7.1 — Sistema de Privacidade da Presença.
   Feeds Context/AI/ranking/heatmap with aggregated (anonymized) data. ==== */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  PresenceRecord,
  PresenceTargetType,
  PresenceVisibilityValue,
} from "@/lib/event-checkin/checkin-types";
import { PresenceVisibility } from "@/lib/event-checkin/checkin-types";
import {
  getStoredPresenceVisibility,
  setStoredPresenceVisibility,
  loadPresenceRecords,
  savePresenceRecords,
  anonymizePresenceList,
  computeMovementMetrics,
  computeHeatmap,
  getPresenceForTarget,
  type PresenceTargetInput,
  type PresenceMetrics,
  type HeatCell,
} from "@/lib/presence/presence-privacy";
import { CheckinTransition } from "@/lib/integration/integration-types";
import type {
  IntegrationFeedItem,
  GeneratedNotification,
} from "@/lib/integration/integration-types";
import { createCheckinEvent, createCheckinMapUpdate } from "@/lib/integration/integration-checkin";
import type { CheckinMapPlaceUpdate } from "@/lib/integration/integration-checkin";
import { createFeedItemFromCheckin } from "@/lib/integration/integration-feed";
import {
  generateNotificationsFromEvent,
  deduplicateNotifications,
  sortByPriority,
} from "@/lib/integration/integration-notifications";
import { dispatchCheckinCreated } from "@/lib/live/live-dispatcher";
import { currentUser } from "@/lib/mock-data";

const CURRENT_USER_ID = "lucas";
const VIEWER_LAT = -23.55;
const VIEWER_LNG = -46.63;

const FRIEND_IDS = ["beatriz", "joao", "maria", "ana", "pedro", "julia", "rafael", "carlos"];

const ORGANIZER_TARGET_IDS = ["cafe-central", "evt-1"];
const PROMO_TARGET_IDS = ["cafe-central"];

let seedCounter = 0;
function seedRecord(
  id: string,
  userId: string,
  userName: string,
  userPhoto: string,
  visibility: PresenceVisibilityValue,
  targetId: string,
  targetName: string,
  targetType: PresenceTargetType,
  minutesAgo: number,
  leftMinutesAgo?: number,
): PresenceRecord {
  seedCounter += 1;
  const lat = VIEWER_LAT + (seedCounter % 5) * 0.004;
  const lng = VIEWER_LNG + (seedCounter % 7) * 0.004;
  const checkedInAt = new Date(Date.now() - minutesAgo * 60000).toISOString();
  return {
    id,
    userId,
    userName,
    userPhoto,
    visibility,
    targetId,
    targetName,
    targetType,
    lat,
    lng,
    checkedInAt,
    ...(leftMinutesAgo !== undefined
      ? { leftAt: new Date(Date.now() - leftMinutesAgo * 60000).toISOString() }
      : {}),
  };
}

function createSeedRecords(): PresenceRecord[] {
  return [
    seedRecord(
      "prs-seed-1",
      "beatriz",
      "Beatriz",
      "https://i.pravatar.cc/200?img=47",
      PresenceVisibility.PUBLIC,
      "cafe-central",
      "Café Central",
      "place",
      8,
    ),
    seedRecord(
      "prs-seed-2",
      "joao",
      "João Silva",
      "https://i.pravatar.cc/200?img=12",
      PresenceVisibility.FRIENDS,
      "vinil-store",
      "Vinil Store",
      "place",
      20,
    ),
    seedRecord(
      "prs-seed-3",
      "maria",
      "Maria Santos",
      "https://i.pravatar.cc/200?img=44",
      PresenceVisibility.ANONYMOUS,
      "cafe-central",
      "Café Central",
      "place",
      5,
    ),
    seedRecord(
      "prs-seed-4",
      "anon-2",
      "Usuário anônimo",
      "https://i.pravatar.cc/200?img=12",
      PresenceVisibility.ANONYMOUS,
      "cafe-central",
      "Café Central",
      "place",
      3,
    ),
    seedRecord(
      "prs-seed-5",
      "pedro",
      "Pedro Lima",
      "https://i.pravatar.cc/200?img=68",
      PresenceVisibility.PUBLIC,
      "evt-1",
      "Noite de Jazz",
      "event",
      12,
    ),
    seedRecord(
      "prs-seed-6",
      "julia",
      "Júlia Costa",
      "https://i.pravatar.cc/200?img=5",
      PresenceVisibility.PUBLIC,
      "evt-1",
      "Noite de Jazz",
      "event",
      25,
    ),
    seedRecord(
      "prs-seed-7",
      "rafael",
      "Rafael Nunes",
      "https://i.pravatar.cc/200?img=32",
      PresenceVisibility.FRIENDS,
      "evt-1",
      "Noite de Jazz",
      "event",
      30,
    ),
    seedRecord(
      "prs-seed-8",
      "ana",
      "Ana Oliveira",
      "https://i.pravatar.cc/200?img=45",
      PresenceVisibility.PUBLIC,
      "vinil-store",
      "Vinil Store",
      "place",
      40,
    ),
    seedRecord(
      "prs-seed-9",
      "carlos",
      "Carlos Souza",
      "https://i.pravatar.cc/200?img=59",
      PresenceVisibility.PUBLIC,
      "cafe-central",
      "Café Central",
      "place",
      180,
      60,
    ),
  ];
}

function loadOrSeedRecords(): PresenceRecord[] {
  if (typeof window === "undefined") return [];
  const existing = loadPresenceRecords();
  if (existing.length > 0) return existing;
  const seeds = createSeedRecords();
  savePresenceRecords(seeds);
  return seeds;
}

function syntheticCoords(targetId: string): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < targetId.length; i++) {
    hash = (hash * 31 + targetId.charCodeAt(i)) >>> 0;
  }
  return {
    lat: VIEWER_LAT + (hash % 100) * 0.0006,
    lng: VIEWER_LNG + ((hash >> 3) % 100) * 0.0006,
  };
}

function buildIntegrationEvent(record: PresenceRecord) {
  const coords =
    record.lat && record.lng
      ? { lat: record.lat, lng: record.lng }
      : syntheticCoords(record.targetId);
  return createCheckinEvent(
    record.userId,
    record.userName,
    record.userPhoto,
    record.targetId,
    record.targetName,
    CheckinTransition.CHECKED_IN,
    record.visibility,
    record.targetId,
    record.targetName,
    coords.lat,
    coords.lng,
  );
}

export interface PresenceContextValue {
  checkins: PresenceRecord[];
  visibility: PresenceVisibilityValue;
  feedItems: IntegrationFeedItem[];
  notifications: GeneratedNotification[];
  placeUpdates: CheckinMapPlaceUpdate[];
  heatmap: HeatCell[];
  setVisibility: (visibility: PresenceVisibilityValue) => void;
  checkIn: (target: PresenceTargetInput, visibilityOverride?: PresenceVisibilityValue) => void;
  leave: (targetId: string) => void;
  updateVisibility: (targetId: string, visibility: PresenceVisibilityValue) => void;
  getPresentList: (targetId: string) => {
    visible: PresenceRecord[];
    anonymousCount: number;
  };
  getMetrics: (targetId: string) => PresenceMetrics;
}

export const PresenceContext = createContext<PresenceContextValue | null>(null);

export function usePresence(): PresenceContextValue {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error("usePresence must be used within PresenceProvider");
  }
  return context;
}

interface PresenceProviderProps {
  children: ReactNode;
}

export function PresenceProvider({ children }: PresenceProviderProps) {
  const [checkins, setCheckins] = useState<PresenceRecord[]>(loadOrSeedRecords);
  const [visibility, setVisibilityState] = useState<PresenceVisibilityValue>(
    getStoredPresenceVisibility,
  );

  useEffect(() => {
    savePresenceRecords(checkins);
  }, [checkins]);

  const setVisibility = useCallback((next: PresenceVisibilityValue) => {
    setStoredPresenceVisibility(next);
    setVisibilityState(next);
  }, []);

  const activeCheckins = useMemo(() => checkins.filter((r) => !r.leftAt), [checkins]);

  /* ==== Feed (spec 23): Público -> publica, Amigos -> somente amigos,
     Anônimo -> nunca publica (createFeedItemFromCheckin retorna null). ==== */
  const feedItems = useMemo<IntegrationFeedItem[]>(() => {
    const items = activeCheckins
      .map((record) => createFeedItemFromCheckin(buildIntegrationEvent(record)))
      .filter((item): item is IntegrationFeedItem => item !== null);
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activeCheckins]);

  /* ==== Notifications (spec 26): organizador recebe novo check-in /
     local movimentado / evento lotando / promoção gerando visitas;
     usuário recebe amigos chegaram (via generateNotificationsFromEvent). ==== */
  const notifications = useMemo<GeneratedNotification[]>(() => {
    const generated: GeneratedNotification[] = [];
    let notifCounter = 0;

    for (const record of activeCheckins) {
      const event = buildIntegrationEvent(record);
      generated.push(
        ...generateNotificationsFromEvent(event, {
          friendIds: FRIEND_IDS,
          followingIds: [],
          userLat: VIEWER_LAT,
          userLng: VIEWER_LNG,
          favoritePlaceIds: [],
        }),
      );

      if (ORGANIZER_TARGET_IDS.includes(record.targetId)) {
        notifCounter += 1;
        generated.push({
          id: `org-checkin-${notifCounter}-${record.id}`,
          category: "NEARBY_EVENT",
          priority: "HIGH",
          title: `✔ Novo check-in`,
          body: `${record.userName} fez check-in em ${record.targetName}`,
          actorName: record.userName,
          metadata: {
            userId: record.userId,
            targetId: record.targetId,
            visibility: record.visibility,
          },
        });
      }
    }

    const placeTargets = activeCheckins.filter((r) => r.targetType === "place");
    const eventTargets = activeCheckins.filter((r) => r.targetType === "event");

    const placeCounts = new Map<string, { name: string; count: number }>();
    for (const record of placeTargets) {
      const current = placeCounts.get(record.targetId) ?? {
        name: record.targetName,
        count: 0,
      };
      current.count += 1;
      placeCounts.set(record.targetId, current);
    }
    for (const [targetId, data] of placeCounts) {
      if (data.count >= 3) {
        generated.push({
          id: `org-busy-${targetId}`,
          category: "NEARBY_EVENT",
          priority: "MEDIUM",
          title: `🔥 Local movimentado`,
          body: `${data.name} está movimentado agora (${data.count} pessoas presentes)`,
          metadata: { targetId },
        });
      }
      if (PROMO_TARGET_IDS.includes(targetId) && data.count >= 3) {
        generated.push({
          id: `org-promo-${targetId}`,
          category: "COUPON_AVAILABLE",
          priority: "LOW",
          title: `🏷️ Promoção gerando visitas`,
          body: `Sua promoção está atraindo público em ${data.name}`,
          metadata: { targetId },
        });
      }
    }

    const eventCounts = new Map<string, { name: string; count: number }>();
    for (const record of eventTargets) {
      const current = eventCounts.get(record.targetId) ?? {
        name: record.targetName,
        count: 0,
      };
      current.count += 1;
      eventCounts.set(record.targetId, current);
    }
    for (const [targetId, data] of eventCounts) {
      if (data.count >= 3) {
        generated.push({
          id: `org-full-${targetId}`,
          category: "NEARBY_EVENT",
          priority: "HIGH",
          title: `🎉 Evento lotando`,
          body: `${data.name} está lotando (${data.count} presentes)`,
          metadata: { targetId },
        });
      }
    }

    return deduplicateNotifications(sortByPriority(generated));
  }, [activeCheckins]);

  /* ==== Map (spec 22): Público aparece no mapa; Amigos só para amigos;
     Anônimo não aparece (count agregado em anonymousCount). ==== */
  const placeUpdates = useMemo<CheckinMapPlaceUpdate[]>(
    () =>
      createCheckinMapUpdate(
        checkins.map((r) => ({
          userId: r.userId,
          userName: r.userName,
          userPhoto: r.userPhoto,
          eventId: r.targetId,
          eventName: r.targetName,
          transition: CheckinTransition.CHECKED_IN,
          visibility: r.visibility,
          placeId: r.targetId,
          placeName: r.targetName,
          placeLat: r.lat ?? syntheticCoords(r.targetId).lat,
          placeLng: r.lng ?? syntheticCoords(r.targetId).lng,
          timestamp: r.checkedInAt,
        })),
        VIEWER_LAT,
        VIEWER_LNG,
      ),
    [checkins],
  );

  /* ==== Analytics / heatmap (spec 25): anônimos alimentam agregados
     sem revelar identidade. ==== */
  const heatmap = useMemo(() => computeHeatmap(activeCheckins), [activeCheckins]);

  const checkIn = useCallback(
    (target: PresenceTargetInput, visibilityOverride?: PresenceVisibilityValue) => {
      const chosen = visibilityOverride ?? visibility;
      const coords =
        target.lat && target.lng
          ? { lat: target.lat, lng: target.lng }
          : syntheticCoords(target.id);
      const record: PresenceRecord = {
        id: `prs-${Date.now()}`,
        userId: CURRENT_USER_ID,
        userName: currentUser.name,
        userPhoto: currentUser.photo,
        visibility: chosen,
        targetId: target.id,
        targetName: target.name,
        targetType: target.type,
        lat: coords.lat,
        lng: coords.lng,
        checkedInAt: new Date().toISOString(),
      };

      setCheckins((prev) => [...prev, record]);

      dispatchCheckinCreated({
        userId: CURRENT_USER_ID,
        userName: currentUser.name,
        userPhoto: currentUser.photo,
        placeName: target.type === "place" ? target.name : "",
        eventId: target.type === "event" ? target.id : null,
        eventName: target.type === "event" ? target.name : null,
        transition: "CHECKED_IN",
        visibility: chosen,
      });
    },
    [visibility],
  );

  const leave = useCallback((targetId: string) => {
    setCheckins((prev) =>
      prev.map((record) =>
        record.userId === CURRENT_USER_ID && record.targetId === targetId && !record.leftAt
          ? { ...record, leftAt: new Date().toISOString() }
          : record,
      ),
    );
  }, []);

  const updateVisibility = useCallback((targetId: string, next: PresenceVisibilityValue) => {
    setCheckins((prev) =>
      prev.map((record) =>
        record.userId === CURRENT_USER_ID && record.targetId === targetId && !record.leftAt
          ? { ...record, visibility: next }
          : record,
      ),
    );
  }, []);

  const getPresentList = useCallback(
    (targetId: string) =>
      anonymizePresenceList(
        getPresenceForTarget(activeCheckins, targetId),
        FRIEND_IDS,
        CURRENT_USER_ID,
      ),
    [activeCheckins],
  );

  const getMetrics = useCallback(
    (targetId: string) => computeMovementMetrics(getPresenceForTarget(activeCheckins, targetId)),
    [activeCheckins],
  );

  const value: PresenceContextValue = {
    checkins,
    visibility,
    feedItems,
    notifications,
    placeUpdates,
    heatmap,
    setVisibility,
    checkIn,
    leave,
    updateVisibility,
    getPresentList,
    getMetrics,
  };

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}
