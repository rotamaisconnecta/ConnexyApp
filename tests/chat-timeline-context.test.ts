import { describe, expect, test } from "bun:test";
import { MessageKind, MessageStatus, type ChatMessage } from "../src/lib/chat/chat-types";
import {
  clusterTimelineMessages,
  isTimelineCard,
  timelineMarkerFor,
  timelineMetaFor,
} from "../src/lib/chat/timeline-context";

function msg(partial: Partial<ChatMessage> & Pick<ChatMessage, "id" | "kind">): ChatMessage {
  const at = partial.at ?? new Date("2026-09-29T20:00:00");
  const base = {
    conversationId: "c1",
    from: "them" as const,
    at,
    status: MessageStatus.READ,
  };
  if (partial.kind === MessageKind.TEXT) {
    return { ...base, ...partial, kind: MessageKind.TEXT, text: "oi" } as ChatMessage;
  }
  if (partial.kind === MessageKind.EVENT) {
    return {
      ...base,
      ...partial,
      kind: MessageKind.EVENT,
      title: "Nosso encontro",
    } as ChatMessage;
  }
  if (partial.kind === MessageKind.LOCATION) {
    return {
      ...base,
      ...partial,
      kind: MessageKind.LOCATION,
      label: "Burger House",
      proximity: "perto",
    } as ChatMessage;
  }
  if (partial.kind === MessageKind.AUDIO) {
    return { ...base, ...partial, kind: MessageKind.AUDIO, durationSec: 7 } as ChatMessage;
  }
  return { ...base, ...partial } as ChatMessage;
}

describe("Linha do tempo viva — agrupamento visual", () => {
  test("evento agrupa mensagens próximas sem inventar dados", () => {
    const messages = [
      msg({ id: "t1", kind: MessageKind.TEXT, at: new Date("2026-09-29T19:55:00") }),
      msg({ id: "e1", kind: MessageKind.EVENT, at: new Date("2026-09-29T20:00:00") }),
      msg({
        id: "a1",
        kind: MessageKind.AUDIO,
        from: "me",
        at: new Date("2026-09-29T20:02:00"),
      }),
    ];
    const clusters = clusterTimelineMessages(messages);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].label).toContain("Nosso encontro");
    expect(clusters[0].messageIds).toEqual(["t1", "e1", "a1"]);
  });

  test("marcadores descrevem o tipo real da mensagem", () => {
    expect(timelineMarkerFor(msg({ id: "e", kind: MessageKind.EVENT }))?.label).toBe("Evento criado");
    expect(timelineMarkerFor(msg({ id: "l", kind: MessageKind.LOCATION }))?.label).toBe(
      "Local compartilhado",
    );
    expect(timelineMarkerFor(msg({ id: "p", kind: MessageKind.IMAGE }))?.label).toBe("Foto enviada");
    expect(isTimelineCard(msg({ id: "e", kind: MessageKind.EVENT }))).toBe(true);
    expect(isTimelineCard(msg({ id: "t", kind: MessageKind.TEXT }))).toBe(false);
  });

  test("mensagens isoladas não viram um único card gigante", () => {
    const messages = [
      msg({ id: "t1", kind: MessageKind.TEXT, at: new Date("2026-09-29T10:00:00") }),
      msg({ id: "t2", kind: MessageKind.TEXT, at: new Date("2026-09-29T18:00:00") }),
    ];
    const meta = timelineMetaFor(messages);
    expect(meta.get("t1")?.clusterId).toBeNull();
    expect(meta.get("t2")?.marker).toBeNull();
  });
});
