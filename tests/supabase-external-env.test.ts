import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PUBLIC_SUPABASE_PUBLISHABLE_KEY_KEY,
  PUBLIC_SUPABASE_URL_KEY,
  resolveServerSupabasePublicConfig,
  resolveSupabasePublicConfig,
  SERVER_SUPABASE_PUBLISHABLE_KEY_KEY,
  SERVER_SUPABASE_URL_KEY,
  SupabaseEnvError,
} from "../src/lib/supabase/external-env";

const projectRoot = join(import.meta.dir, "..");

const SERVER = {
  [SERVER_SUPABASE_URL_KEY]: "https://server.supabase.co",
  [SERVER_SUPABASE_PUBLISHABLE_KEY_KEY]: "sb_publishable_server",
};
const PUBLIC = {
  [PUBLIC_SUPABASE_URL_KEY]: "https://public.supabase.co",
  [PUBLIC_SUPABASE_PUBLISHABLE_KEY_KEY]: "sb_publishable_public",
};

describe("Marco A1 — leitura uniforme de env Supabase (URL + publishable key)", () => {
  test("servidor: resolve a partir de APP_* somente", () => {
    expect(resolveSupabasePublicConfig(SERVER, {})).toEqual({
      url: "https://server.supabase.co",
      key: "sb_publishable_server",
    });
  });

  test("servidor: cai para o namespace público VITE_APP_* quando APP_* ausente", () => {
    expect(resolveSupabasePublicConfig({}, PUBLIC)).toEqual({
      url: "https://public.supabase.co",
      key: "sb_publishable_public",
    });
  });

  test("servidor: APP_* e VITE_APP_* iguais são aceitos", () => {
    const both = { ...PUBLIC };
    expect(resolveSupabasePublicConfig(both, both)).toEqual({
      url: "https://public.supabase.co",
      key: "sb_publishable_public",
    });
  });

  test("conflito de URL falha em vez de escolher silenciosamente", () => {
    const publicWithServerUrl = {
      ...PUBLIC,
      [PUBLIC_SUPABASE_URL_KEY]: "https://different.supabase.co",
    };
    expect(() => resolveSupabasePublicConfig(SERVER, publicWithServerUrl)).toThrow(
      SupabaseEnvError,
    );
  });

  test("conflito de publishable key falha em vez de escolher silenciosamente", () => {
    const publicWithServerKey = {
      ...PUBLIC,
      [PUBLIC_SUPABASE_PUBLISHABLE_KEY_KEY]: "sb_publishable_different",
    };
    expect(() => resolveSupabasePublicConfig(SERVER, publicWithServerKey)).toThrow(
      SupabaseEnvError,
    );
  });

  test("ausência total nomeia as variáveis, sem valores", () => {
    try {
      resolveSupabasePublicConfig({}, {});
      throw new Error("esperava SupabaseEnvError");
    } catch (error) {
      expect(error).toBeInstanceOf(SupabaseEnvError);
      const message = (error as Error).message;
      expect(message).toContain(SERVER_SUPABASE_URL_KEY);
      expect(message).toContain(PUBLIC_SUPABASE_URL_KEY);
      expect(message).toContain(SERVER_SUPABASE_PUBLISHABLE_KEY_KEY);
      expect(message).toContain(PUBLIC_SUPABASE_PUBLISHABLE_KEY_KEY);
    }
  });

  test("valor vazio ou só espaços conta como ausente", () => {
    expect(() =>
      resolveSupabasePublicConfig(
        { [SERVER_SUPABASE_URL_KEY]: "   " },
        { [PUBLIC_SUPABASE_URL_KEY]: "" },
      ),
    ).toThrow(SupabaseEnvError);
  });

  test("mensagens de erro nunca contêm os valores configurados", () => {
    const url = "https://leaky.example.supabase.co";
    try {
      resolveSupabasePublicConfig({ [SERVER_SUPABASE_URL_KEY]: url }, {});
      throw new Error("esperava SupabaseEnvError");
    } catch (error) {
      expect(error).toBeInstanceOf(SupabaseEnvError);
      const message = (error as Error).message;
      expect(message.includes(url)).toBe(false);
    }
  });

  test("resolveServerSupabasePublicConfig aceita mapas explícitos", () => {
    expect(resolveServerSupabasePublicConfig(SERVER, {})).toEqual({
      url: "https://server.supabase.co",
      key: "sb_publishable_server",
    });
  });
});

describe("Marco A1 — fiação dos consumidores server-side", () => {
  test("auth-middleware usa o resolver compartilhado e não lê VITE_APP_ direto", async () => {
    const text = await readFile(
      join(projectRoot, "src/integrations/supabase/auth-middleware.ts"),
      "utf8",
    );
    expect(text).toContain("resolveServerSupabasePublicConfig");
    expect(text.includes("import.meta.env.VITE_APP_SUPABASE_URL")).toBe(false);
    expect(text.includes("import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY")).toBe(false);
  });

  test("handlers server-side usam o resolver compartilhado", async () => {
    for (const file of [
      "src/lib/supabase/server.server.ts",
      "src/lib/media/media-url.functions.ts",
      "src/lib/supabase/config.ts",
    ]) {
      const text = await readFile(join(projectRoot, file), "utf8");
      expect(text).toContain("external-env");
    }
  });

  test("clientes de navegador nunca leem APP_SUPABASE_* nem service role", async () => {
    for (const file of ["src/lib/supabase/client.ts", "src/integrations/supabase/client.ts"]) {
      const text = await readFile(join(projectRoot, file), "utf8");
      expect(text.includes("process.env.APP_SUPABASE_URL")).toBe(false);
      expect(text.includes("process.env.APP_SUPABASE_PUBLISHABLE_KEY")).toBe(false);
      expect(text.includes("SERVICE_ROLE")).toBe(false);
    }
  });
});
