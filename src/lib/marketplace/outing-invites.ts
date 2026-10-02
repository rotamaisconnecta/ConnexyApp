import { useEffect, useState } from "react";
import { currentUser, people } from "@/lib/mock-data";
import type { CompanionStopInput } from "@/lib/mobility/ride-search";

export const OUTING_INVITES_STORAGE_KEY = "connexy:demo:outing-invites";
export const OUTING_INVITES_EVENT = "connexy:demo:outing-invites";

export const OutingInviteStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
} as const;

export type OutingInviteStatusValue = (typeof OutingInviteStatus)[keyof typeof OutingInviteStatus];

export type OutingInviteTarget = {
  id: string;
  title: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type OutingInviteStop = {
  address: string;
  lat: number;
  lng: number;
};

export type OutingInvite = {
  id: string;
  targetId: string;
  personId: string;
  fromUserId: string;
  message: string;
  status: OutingInviteStatusValue;
  createdAt: number;
  respondedAt?: number;
  targetTitle?: string;
  targetAddress?: string | null;
  targetLat?: number | null;
  targetLng?: number | null;
  stopAddress?: string;
  stopLat?: number;
  stopLng?: number;
  tripId?: string;
  asDestination?: boolean;
};

export type OutingInviteInput = {
  fromUserId: string;
  toUserId: string;
  target: OutingInviteTarget;
  message: string;
  stop?: OutingInviteStop;
  tripId?: string;
  asDestination?: boolean;
};

function readRaw(): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(OUTING_INVITES_STORAGE_KEY) ?? "",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isStatus(value: unknown): value is OutingInviteStatusValue {
  return (
    value === OutingInviteStatus.PENDING ||
    value === OutingInviteStatus.ACCEPTED ||
    value === OutingInviteStatus.DECLINED
  );
}

function normalizeInvite(value: unknown): OutingInvite | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.targetId !== "string" ||
    typeof record.personId !== "string" ||
    typeof record.createdAt !== "number"
  ) {
    return null;
  }
  return {
    id: record.id,
    targetId: record.targetId,
    personId: record.personId,
    fromUserId:
      typeof record.fromUserId === "string" && record.fromUserId
        ? record.fromUserId
        : currentUser.id,
    message: typeof record.message === "string" ? record.message : "",
    status: isStatus(record.status) ? record.status : OutingInviteStatus.PENDING,
    createdAt: record.createdAt,
    respondedAt: typeof record.respondedAt === "number" ? record.respondedAt : undefined,
    targetTitle: typeof record.targetTitle === "string" ? record.targetTitle : undefined,
    targetAddress: typeof record.targetAddress === "string" ? record.targetAddress : null,
    targetLat: typeof record.targetLat === "number" ? record.targetLat : null,
    targetLng: typeof record.targetLng === "number" ? record.targetLng : null,
    stopAddress: typeof record.stopAddress === "string" ? record.stopAddress : undefined,
    stopLat: typeof record.stopLat === "number" ? record.stopLat : undefined,
    stopLng: typeof record.stopLng === "number" ? record.stopLng : undefined,
    tripId: typeof record.tripId === "string" ? record.tripId : undefined,
    asDestination: record.asDestination === true,
  };
}

export function listOutingInvites(): OutingInvite[] {
  return readRaw()
    .map(normalizeInvite)
    .filter((invite): invite is OutingInvite => invite != null)
    .sort((left, right) => right.createdAt - left.createdAt);
}

function writeInvites(invites: OutingInvite[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OUTING_INVITES_STORAGE_KEY, JSON.stringify(invites));
    window.dispatchEvent(new CustomEvent(OUTING_INVITES_EVENT));
  } catch {
    /* storage unavailable */
  }
}

export function subscribeOutingInvites(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onCustom = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === OUTING_INVITES_STORAGE_KEY) listener();
  };
  window.addEventListener(OUTING_INVITES_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(OUTING_INVITES_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function useOutingInviteVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeOutingInvites(() => setVersion((current) => current + 1)), []);
  return version;
}

export function getOutingInvite(id: string): OutingInvite | null {
  return listOutingInvites().find((invite) => invite.id === id) ?? null;
}

export function listOutgoingOutingInvites(fromUserId: string, targetId?: string): OutingInvite[] {
  return listOutingInvites().filter(
    (invite) =>
      invite.fromUserId === fromUserId && (targetId == null || invite.targetId === targetId),
  );
}

export function listIncomingOutingInvites(toUserId: string): OutingInvite[] {
  return listOutingInvites().filter((invite) => invite.personId === toUserId);
}

export function listIncomingPendingOutingInvites(toUserId: string): OutingInvite[] {
  return listIncomingOutingInvites(toUserId).filter(
    (invite) => invite.status === OutingInviteStatus.PENDING,
  );
}

export function sendOutingInvite(input: OutingInviteInput): OutingInvite {
  const invites = listOutingInvites();
  const existing = invites.find(
    (invite) =>
      invite.fromUserId === input.fromUserId &&
      invite.personId === input.toUserId &&
      invite.targetId === input.target.id &&
      invite.status === OutingInviteStatus.PENDING,
  );
  const now = Date.now();
  const next: OutingInvite = {
    id: existing?.id ?? `outing-${now}-${input.toUserId}`,
    targetId: input.target.id,
    personId: input.toUserId,
    fromUserId: input.fromUserId,
    message: input.message.trim(),
    status: OutingInviteStatus.PENDING,
    createdAt: existing?.createdAt ?? now,
    targetTitle: input.target.title,
    targetAddress: input.target.address ?? null,
    targetLat: input.target.latitude ?? null,
    targetLng: input.target.longitude ?? null,
    stopAddress: input.stop?.address,
    stopLat: input.stop?.lat,
    stopLng: input.stop?.lng,
    tripId: input.tripId,
    asDestination: input.asDestination === true,
  };
  writeInvites([next, ...invites.filter((invite) => invite.id !== next.id)]);
  return next;
}

export function respondToOutingInvite(
  inviteId: string,
  actorId: string,
  accepted: boolean,
): OutingInvite | null {
  const invites = listOutingInvites();
  const invite = invites.find((item) => item.id === inviteId);
  if (!invite || !actorId || invite.personId !== actorId || invite.fromUserId === actorId) {
    return invite ?? null;
  }
  const nextStatus = accepted ? OutingInviteStatus.ACCEPTED : OutingInviteStatus.DECLINED;
  if (invite.status !== OutingInviteStatus.PENDING) return invite;
  const updated: OutingInvite = { ...invite, status: nextStatus, respondedAt: Date.now() };
  writeInvites(invites.map((item) => (item.id === inviteId ? updated : item)));
  return updated;
}

export function cancelOutingInvite(inviteId: string, actorId: string): OutingInvite | null {
  const invites = listOutingInvites();
  const invite = invites.find((item) => item.id === inviteId);
  if (!invite || invite.fromUserId !== actorId) return invite ?? null;
  if (invite.status === OutingInviteStatus.DECLINED) return invite;
  const updated: OutingInvite = {
    ...invite,
    status: OutingInviteStatus.DECLINED,
    respondedAt: Date.now(),
  };
  writeInvites(invites.map((item) => (item.id === inviteId ? updated : item)));
  return updated;
}

export function listReservedOutingInvites(fromUserId: string, tripId?: string, targetId?: string): OutingInvite[] {
  return listOutgoingOutingInvites(fromUserId, targetId).filter((invite) => {
    if (invite.status !== OutingInviteStatus.PENDING && invite.status !== OutingInviteStatus.ACCEPTED) {
      return false;
    }
    if (tripId) return invite.tripId === tripId;
    return true;
  });
}

export function isOutingRideAvailable(fromUserId: string, targetId?: string): boolean {
  return listOutgoingOutingInvites(fromUserId, targetId).some(
    (invite) => invite.status === OutingInviteStatus.ACCEPTED,
  );
}

function stopForInvite(invite: OutingInvite): CompanionStopInput | null {
  const person = people.find((item) => item.id === invite.personId);
  const name = person?.name ?? invite.personId;
  if (
    typeof invite.stopAddress === "string" &&
    typeof invite.stopLat === "number" &&
    typeof invite.stopLng === "number"
  ) {
    return {
      id: invite.personId,
      name,
      address: invite.stopAddress,
      lat: invite.stopLat,
      lng: invite.stopLng,
    };
  }
  if (!person) return null;
  return {
    id: person.id,
    name: person.name,
    address: person.address ?? name,
    lat: person.latitude ?? 0,
    lng: person.longitude ?? 0,
  };
}

export function listAcceptedOutingCompanions(
  fromUserId: string,
  targetId: string,
): CompanionStopInput[] {
  return listOutgoingOutingInvites(fromUserId, targetId)
    .filter((invite) => invite.status === OutingInviteStatus.ACCEPTED)
    .map(stopForInvite)
    .filter((stop): stop is CompanionStopInput => stop != null);
}

export function getOutingRideSearch(fromUserId: string, targetId: string) {
  const accepted = listOutgoingOutingInvites(fromUserId, targetId).filter(
    (invite) => invite.status === OutingInviteStatus.ACCEPTED,
  );
  if (accepted.length === 0) return null;
  const sample = accepted[0];
  return {
    destinationId: sample.targetId,
    destinationName: sample.targetTitle ?? sample.targetId,
    destinationAddress: sample.targetAddress ?? null,
    destinationLat: sample.targetLat ?? null,
    destinationLng: sample.targetLng ?? null,
    companions: JSON.stringify(listAcceptedOutingCompanions(fromUserId, targetId)),
    source: "invite" as const,
  };
}
