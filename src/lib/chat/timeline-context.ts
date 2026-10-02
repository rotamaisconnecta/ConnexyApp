import type { ChatMessage } from "./chat-types";
import { MessageKind } from "./chat-types";

export type TimelineMarkerKind =
  | "event"
  | "place"
  | "photo"
  | "video"
  | "audio"
  | "file"
  | "topic";

export type TimelineMarker = {
  kind: TimelineMarkerKind;
  label: string;
};

export type TimelineCluster = {
  id: string;
  label: string;
  messageIds: string[];
};

const CLUSTER_WINDOW_MS = 12 * 60 * 1000;

export function isTimelineHighlight(message: ChatMessage): boolean {
  return (
    message.kind === MessageKind.EVENT ||
    message.kind === MessageKind.LOCATION ||
    message.kind === MessageKind.IMAGE ||
    message.kind === MessageKind.VIDEO ||
    message.kind === MessageKind.AUDIO ||
    message.kind === MessageKind.FILE
  );
}

export function isTimelineCard(message: ChatMessage): boolean {
  return (
    message.kind === MessageKind.EVENT ||
    message.kind === MessageKind.LOCATION ||
    message.kind === MessageKind.IMAGE ||
    message.kind === MessageKind.VIDEO
  );
}

export function timelineMarkerFor(message: ChatMessage): TimelineMarker | null {
  switch (message.kind) {
    case MessageKind.EVENT:
      return { kind: "event", label: "Evento criado" };
    case MessageKind.LOCATION:
      return { kind: "place", label: "Local compartilhado" };
    case MessageKind.IMAGE:
      return { kind: "photo", label: "Foto enviada" };
    case MessageKind.VIDEO:
      return { kind: "video", label: "Vídeo enviado" };
    case MessageKind.AUDIO:
      return { kind: "audio", label: "Áudio" };
    case MessageKind.FILE:
      return { kind: "file", label: "Arquivo" };
    default:
      return null;
  }
}

function clusterLabelFor(message: ChatMessage): string {
  if (message.kind === MessageKind.EVENT) {
    return message.title.trim() ? `Conversa sobre ${message.title}` : "Evento criado";
  }
  if (message.kind === MessageKind.LOCATION) {
    return message.label.trim() ? `Conversa sobre ${message.label}` : "Local compartilhado";
  }
  return timelineMarkerFor(message)?.label ?? "Novo assunto";
}

function isAnchor(message: ChatMessage): boolean {
  return message.kind === MessageKind.EVENT || message.kind === MessageKind.LOCATION;
}

export function clusterTimelineMessages(messages: readonly ChatMessage[]): TimelineCluster[] {
  const clusters: TimelineCluster[] = [];
  const assigned = new Set<string>();

  messages.forEach((anchor, index) => {
    if (!isAnchor(anchor) || assigned.has(anchor.id)) return;
    const start = anchor.at.getTime() - CLUSTER_WINDOW_MS;
    const end = anchor.at.getTime() + CLUSTER_WINDOW_MS;
    const messageIds: string[] = [];
    for (let i = 0; i < messages.length; i += 1) {
      const item = messages[i];
      if (assigned.has(item.id)) continue;
      const time = item.at.getTime();
      if (time < start || time > end) continue;
      if (i < index && !isTimelineHighlight(item) && item.kind !== MessageKind.TEXT) continue;
      messageIds.push(item.id);
    }
    if (messageIds.length === 0) messageIds.push(anchor.id);
    messageIds.forEach((id) => assigned.add(id));
    clusters.push({
      id: `cluster-${anchor.id}`,
      label: clusterLabelFor(anchor),
      messageIds,
    });
  });

  return clusters;
}

export function timelineMetaFor(
  messages: readonly ChatMessage[],
): Map<string, { clusterId: string | null; clusterLabel: string | null; isClusterStart: boolean; marker: TimelineMarker | null }> {
  const clusters = clusterTimelineMessages(messages);
  const byId = new Map<
    string,
    { clusterId: string | null; clusterLabel: string | null; isClusterStart: boolean; marker: TimelineMarker | null }
  >();

  for (const message of messages) {
    byId.set(message.id, {
      clusterId: null,
      clusterLabel: null,
      isClusterStart: false,
      marker: timelineMarkerFor(message),
    });
  }

  for (const cluster of clusters) {
    cluster.messageIds.forEach((id, index) => {
      const current = byId.get(id);
      if (!current) return;
      byId.set(id, {
        ...current,
        clusterId: cluster.id,
        clusterLabel: cluster.label,
        isClusterStart: index === 0,
      });
    });
  }

  return byId;
}
