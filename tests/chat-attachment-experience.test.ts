import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PresenceVisibility, type PresenceRecord } from "../src/lib/event-checkin/checkin-types";
import { ATTACHMENT_OPTIONS, MessageKind } from "../src/lib/chat/chat-types";
import {
  formatCurrentLocationShare,
  isValidCoordinates,
} from "../src/lib/chat/current-location";
import { listShareableCheckins } from "../src/lib/chat/shareable-checkins";
import {
  reduceVoiceRecorderPhase,
  VoiceRecorderPhase,
} from "../src/lib/chat/voice-recorder-state";

const projectRoot = join(import.meta.dir, "..");

function presence(partial: Omit<PresenceRecord, "userName" | "userPhoto" | "visibility"> & {
  userName?: string;
  userPhoto?: string;
  visibility?: PresenceRecord["visibility"];
}): PresenceRecord {
  return {
    userName: partial.userName ?? "Lucas",
    userPhoto: partial.userPhoto ?? "",
    visibility: partial.visibility ?? PresenceVisibility.PUBLIC,
    ...partial,
  };
}

describe("Anexar — opções", () => {
  test("o sheet tem só Galeria, Arquivo, Localização e Evento ou local", () => {
    expect(ATTACHMENT_OPTIONS.map((item) => item.label)).toEqual([
      "Galeria",
      "Arquivo",
      "Localização",
      "Evento ou local",
    ]);
    expect(ATTACHMENT_OPTIONS.map((item) => item.kind)).toEqual([
      MessageKind.IMAGE,
      MessageKind.FILE,
      MessageKind.LOCATION,
      "share-content",
    ]);
    expect(ATTACHMENT_OPTIONS.some((item) => item.kind === MessageKind.AUDIO)).toBe(false);
  });

  test("o layout fecha as quatro opções sem deixar o buraco do Áudio", async () => {
    const sheet = await readFile(
      join(projectRoot, "src/components/chat/attachment-sheet.tsx"),
      "utf8",
    );
    expect(sheet).toContain("grid-cols-2");
    expect(sheet).toContain("min-[360px]:grid-cols-4");
    expect(sheet).not.toContain("MessageKind.AUDIO");
    expect(sheet).not.toContain("Mic");
    expect(sheet).not.toContain("Áudio");
  });

  test("Arquivo usa um seletor sem lista fixa de extensões", async () => {
    const screen = await readFile(
      join(projectRoot, "src/components/chat/ConnexyChatScreen.tsx"),
      "utf8",
    );
    expect(screen).toContain('if (kind === "file")');
    expect(screen).toContain("fileInputRef");
    expect(screen).toContain('removeAttribute("accept")');
    expect(screen).not.toContain(".pdf,.doc");
    expect(screen).not.toContain("application/pdf");
  });
});

describe("Check-ins compartilháveis", () => {
  test("lista só o que o próprio usuário visitou", () => {
    const records = [
      presence({
        id: "a",
        userId: "lucas",
        targetId: "cafe-central",
        targetType: "place",
        targetName: "Café Central",
        checkedInAt: "2026-09-29T18:00:00.000Z",
      }),
      presence({
        id: "b",
        userId: "beatriz",
        targetId: "vinil-store",
        targetType: "place",
        targetName: "Vinil Store",
        checkedInAt: "2026-09-29T19:00:00.000Z",
      }),
      presence({
        id: "c",
        userId: "lucas",
        targetId: "evt-1",
        targetType: "event",
        targetName: "Noite de Jazz",
        checkedInAt: "2026-09-29T20:00:00.000Z",
      }),
    ];
    const items = listShareableCheckins(records, "lucas");
    expect(items.map((item) => item.id).sort()).toEqual(["cafe-central", "evt-1"]);
    expect(items.every((item) => item.proximity === "Você esteve aqui")).toBe(true);
  });

  test("não inventa catálogo e ignora check-in sem usuário", () => {
    expect(listShareableCheckins([], "lucas")).toEqual([]);
    expect(
      listShareableCheckins(
        [
          presence({
            id: "x",
            userId: "lucas",
            targetId: "cafe-central",
            targetType: "place",
            targetName: "Café Central",
            checkedInAt: "2026-09-29T18:00:00.000Z",
          }),
        ],
        "",
      ),
    ).toEqual([]);
  });
});

describe("Localização atual", () => {
  test("só formata coordenadas válidas", () => {
    expect(isValidCoordinates(Number.NaN, -46.63)).toBe(false);
    expect(isValidCoordinates(-23.55, 181)).toBe(false);
    expect(formatCurrentLocationShare({ latitude: 91, longitude: 0 })).toBeNull();
    expect(
      formatCurrentLocationShare({
        latitude: -23.55052,
        longitude: -46.6333,
        accuracy: 12.4,
      }),
    ).toEqual({
      label: "Minha localização",
      proximity: "-23.55052, -46.63330 · precisão de 12 m",
      lat: -23.55052,
      lng: -46.6333,
    });
  });
});

describe("Estados do gravador", () => {
  test("STOP vai para preview e só send dispara envio", () => {
    expect(reduceVoiceRecorderPhase(VoiceRecorderPhase.IDLE, "start")).toBe(
      VoiceRecorderPhase.RECORDING,
    );
    expect(reduceVoiceRecorderPhase(VoiceRecorderPhase.RECORDING, "stop")).toBe(
      VoiceRecorderPhase.PREVIEW,
    );
    expect(reduceVoiceRecorderPhase(VoiceRecorderPhase.RECORDING, "cancel")).toBe(
      VoiceRecorderPhase.IDLE,
    );
    expect(reduceVoiceRecorderPhase(VoiceRecorderPhase.PREVIEW, "discard")).toBe(
      VoiceRecorderPhase.IDLE,
    );
    expect(reduceVoiceRecorderPhase(VoiceRecorderPhase.PREVIEW, "send")).toBe(
      VoiceRecorderPhase.SENDING,
    );
    expect(reduceVoiceRecorderPhase(VoiceRecorderPhase.SENDING, "sent")).toBe(
      VoiceRecorderPhase.SENT,
    );
    expect(reduceVoiceRecorderPhase(VoiceRecorderPhase.RECORDING, "send")).toBe(
      VoiceRecorderPhase.RECORDING,
    );
    expect(reduceVoiceRecorderPhase(VoiceRecorderPhase.PREVIEW, "stop")).toBe(
      VoiceRecorderPhase.PREVIEW,
    );
  });

  test("o preview exige ação explícita antes de onComplete", async () => {
    const source = await readFile(
      join(projectRoot, "src/components/chat/voice-recorder.tsx"),
      "utf8",
    );
    expect(source).toContain('aria-label="STOP"');
    expect(source).toContain("Cancelar");
    expect(source).toContain("Descartar");
    expect(source).toContain("Enviar");
    expect(source).toContain("go(\"send\")");
    expect(source).toContain("await onComplete(clip)");
    expect(source).not.toContain("onComplete(next)");
  });
});
