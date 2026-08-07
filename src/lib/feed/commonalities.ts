/* =========================================================
   commonalities.ts — Afinidades + regra de exibição de pessoas.
   Pure TypeScript. No React. SSR-safe.
   Reusa mock-data e o estado de convites/conexões simulados.
   Não toca em Supabase, migrations, RLS ou no Orchestrator.
========================================================= */

import { currentUser, findPlace, type Person, type Place } from "@/lib/mock-data";
import {
  getConversationId,
  getConversationInviteStatus,
} from "@/lib/chat/mock-conversation-invites";

/* ─── Afinidades ───────────────────────────────────────── */

export type CommonalityGroup = "interests" | "categories" | "places" | "vibe" | "connections";

export interface CommonalityItem {
  label: string;
  group: CommonalityGroup;
}

export interface PersonCommonalities {
  items: CommonalityItem[];
  labels: string[];
  total: number;
}

/* Ordem de prioridade das afinidades exibidas:
   1) interesses  2) categorias favoritas  3) lugares favoritos
   4) vibe        5) conexões               (nada vazio é exibido) */
export function getCommonalities(person: Person): PersonCommonalities {
  const items: CommonalityItem[] = [];

  const userInterests = new Set(currentUser.interests);
  for (const interest of person.interests) {
    if (userInterests.has(interest)) {
      items.push({ label: interest, group: "interests" });
    }
  }

  const userPlaces = (currentUser.favoritePlaceIds ?? [])
    .map(findPlace)
    .filter((p): p is Place => p != null);
  const personPlaces = (person.favoritePlaceIds ?? [])
    .map(findPlace)
    .filter((p): p is Place => p != null);
  const userCategories = new Set(userPlaces.map((p) => p.category));
  const sharedCategories = new Set<string>();
  for (const place of personPlaces) {
    if (userCategories.has(place.category)) sharedCategories.add(place.category);
  }
  for (const category of sharedCategories) {
    items.push({ label: category, group: "categories" });
  }

  const userPlaceIds = new Set(currentUser.favoritePlaceIds ?? []);
  for (const placeId of person.favoritePlaceIds ?? []) {
    if (userPlaceIds.has(placeId)) {
      const place = findPlace(placeId);
      if (place) items.push({ label: place.name, group: "places" });
    }
  }

  const userVibe = new Set(currentUser.vibeTags ?? []);
  for (const vibe of person.vibeTags ?? []) {
    if (userVibe.has(vibe)) {
      items.push({ label: vibe, group: "vibe" });
    }
  }

  if (getConversationId(person.id) != null) {
    items.push({ label: "Conexão ativa", group: "connections" });
  }

  return { items, labels: items.map((item) => item.label), total: items.length };
}

/* ─── Regra de exibição (descoberta) ─────────────────────
   Exclui: a própria pessoa, bloqueados, ocultados, conexões
   ativas, pendentes de convite e perfis já conectados.
   Convites recusados seguem visíveis (podem ser reenviados). */

const BLOCKED_STORAGE_KEY = "connexy.mock.blocked-person-ids";
const HIDDEN_STORAGE_KEY = "connexy.mock.hidden-person-ids";

function readStringSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set();
  }
}

export function shouldShowNearbyPerson(personId: string): boolean {
  if (personId === currentUser.id) return false;
  if (getConversationId(personId) != null) return false;
  const status = getConversationInviteStatus(personId);
  if (status === "connected" || status === "invited") return false;
  if (readStringSet(BLOCKED_STORAGE_KEY).has(personId)) return false;
  if (readStringSet(HIDDEN_STORAGE_KEY).has(personId)) return false;
  return true;
}
