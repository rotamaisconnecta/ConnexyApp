import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DEMO_USER_ANA, DEMO_USER_RAFAEL } from "../src/lib/demo/demo-cast";
import { setDemoEnabledForTests } from "../src/lib/demo/demo-config";
import { getDemoIdentity, setDemoIdentity } from "../src/lib/demo/demo-identity";
import {
  acceptRequest,
  getIncomingPendingRequest,
  getOutgoingPendingRequest,
  isConnected,
  sendRequest,
} from "../src/lib/demo/demo-db";
import { findPerson } from "../src/lib/mock-data";

const VIEWER = "lucas";
const SWITCHED = "beatriz";
const projectRoot = join(import.meta.dir, "..");

type MemoryStorage = Storage & { keys(): string[] };

function createMemoryStorage(): MemoryStorage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => data.set(String(key), String(value)),
    keys: () => [...data.keys()],
  } as MemoryStorage;
}

function installBrowser(storage: MemoryStorage = createMemoryStorage()): MemoryStorage {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      localStorage: storage,
      dispatchEvent: () => true,
      addEventListener() {},
      removeEventListener() {},
    },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: storage,
  });
  return storage;
}

async function source(relativePath: string) {
  return readFile(join(projectRoot, relativePath), "utf8");
}

beforeEach(() => {
  installBrowser();
  setDemoEnabledForTests(true);
});

afterEach(() => setDemoEnabledForTests(null));

describe("Fase 10 — identidade da pessoa", () => {
  test("identidade demo ativa muda sem trocar a pessoa do catálogo", () => {
    expect(getDemoIdentity().id).toBe(VIEWER);

    setDemoIdentity(SWITCHED);

    expect(getDemoIdentity().id).toBe(SWITCHED);
    expect(findPerson(SWITCHED)?.id).toBe(SWITCHED);
  });

  test("solicitação para si mesmo é inválida no domínio", () => {
    setDemoIdentity(SWITCHED);

    expect(() => sendRequest(SWITCHED, SWITCHED, "Oi")).toThrow(
      "Remetente e destinatário da solicitação são inválidos.",
    );
  });
});

describe("Fase 10 — estados de conexão no perfil", () => {
  test("conexão existente é reconhecida e usa o conversationId canônico", async () => {
    sendRequest(VIEWER, DEMO_USER_ANA, "Oi");

    const connection = await acceptRequest(VIEWER, DEMO_USER_ANA);

    expect(isConnected(DEMO_USER_ANA, VIEWER)).toBe(true);
    expect(connection.conversationId).toBe(
      `demo-direct-${[VIEWER, DEMO_USER_ANA].sort().join("--")}`,
    );
  });

  test("solicitação recebida fica distinguível da enviada", () => {
    sendRequest(DEMO_USER_RAFAEL, VIEWER, "Oi, estamos por perto.");

    expect(getIncomingPendingRequest(DEMO_USER_RAFAEL, VIEWER)?.toUserId).toBe(VIEWER);
    expect(getOutgoingPendingRequest(DEMO_USER_RAFAEL, VIEWER)).not.toBeNull();
    expect(getOutgoingPendingRequest(VIEWER, DEMO_USER_RAFAEL)).toBeNull();
    expect(getIncomingPendingRequest(VIEWER, DEMO_USER_RAFAEL)).toBeNull();
  });
});

describe("Fase 10 — perfil, CTA e solicitação (inspeção de código)", () => {
  test("perfil deriva o próprio perfil da identidade ativa", async () => {
    const perfil = await source("src/routes/_app.perfil.$id.tsx");

    expect(perfil).toContain("getDemoIdentity");
    expect(perfil).toContain("redirect({ to: \"/perfil\" })");
    expect(perfil).not.toMatch(/isOwnProfile\s*=\s*person\.id\s*===\s*currentUser\.id/);
    expect(perfil).toContain("ConversationInviteButton");
    expect(perfil).not.toContain("demo-direct-");
    expect(perfil).not.toMatch(/latitude|longitude/);
  });

  test("CTA reconhece convite recebido e conversa existente", async () => {
    const invite = await source("src/components/chat/conversation-invite-button.tsx");

    expect(invite).toContain("useDemoPendingRequests");
    expect(invite).toContain('"incoming"');
    expect(invite).toContain('mode: "receive"');
    expect(invite).toMatch(/user\?\.id\s*===\s*personId|user\.id\s*===\s*personId/);
    expect(invite).toContain("getConnectionBetween");
    expect(invite).toContain('to: "/chat/$conversationId"');
    expect(invite).not.toContain("demo-direct-");
  });

  test("solicitação respeita a solicitação pendente recebida", async () => {
    const solicitacao = await source("src/routes/_app.solicitacao.$id.tsx");

    expect(solicitacao).toMatch(/incomingRequest\s*\?\s*"receive"/);
    expect(solicitacao).toContain("sendRequest(user.id, id, message)");
    expect(solicitacao).toContain("acceptRequest(id, user.id)");
    expect(solicitacao).toContain('mode="invite"');
  });
});
