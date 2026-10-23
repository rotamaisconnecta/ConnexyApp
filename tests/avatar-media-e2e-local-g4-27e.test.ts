import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSchemaAClient, type SchemaAClient } from "../src/integrations/supabase/remote";
import { verifySupabaseBearer } from "../src/lib/supabase/auth-middleware";
import {
  AVATAR_MEDIA_URL_TTL_SECONDS,
  createServerAvatarMediaUrlService,
} from "../src/lib/media/avatar-media-authorization.server";
import { AVATAR_BUCKET } from "../src/lib/media/avatar-media";
import {
  cleanupAvatarFixture,
  createAvatarFixture,
  decodePng,
  JPEG_1X1_BYTES,
  PNG_SIGNATURE,
  privatizeLocalAvatarBucket,
  restoreLocalAvatarBucket,
  type AvatarFixture,
  type PrivateBucketRestore,
} from "./helpers/g4-27e-avatar-fixture";
import {
  isLocalStackUrl,
  queryLocalPsql,
  resolveLocalEnv,
  type LocalStack,
} from "./helpers/g4-27e-local-stack";

/**
 * G4.27E — E2E LOCAL do avatar em bucket privado.
 *
 * Este teste nao substitui mocks: ele executa o fluxo real contra o stack
 * Supabase LOCAL (GoTrue + PostgREST + Storage + PostgreSQL):
 *
 *   1. usuario de teste criado no GoTrue local (fixture isolada, cleanup no fim);
 *   2. upload da imagem no bucket `avatars` usando a SESSAO do proprio usuario
 *      (RLS `Avatars owner upload` aplicada de verdade);
 *   3. `profiles.photo_url` persistido com o caminho canonico `{ownerId}/{uuid}.png`;
 *   4. autorizacao real: `verifySupabaseBearer` (o mesmo middleware do app)
 *      -> `createServerAvatarMediaUrlService` (o mesmo servico do app)
 *      -> `createSignedUrl` server-side com service role;
 *   5. CARREGAMENTO REAL DA IMAGEM: a URL assinada e baixada e os bytes sao
 *      DECODIFICADOS (assinatura PNG, IHDR e inflate do IDAT) e comparados com
 *      os pixels originais.
 *
 * O bucket `avatars` local e posto em modo PRIVADO no `beforeAll` aplicando a
 * migration REPO `20261021042744_g4_27b_avatar_c2_private_bucket_and_guard_hardening.sql`
 * e o estado anterior e restaurado no `afterAll` (snapshot/restore exatos).
 *
 * Seguranca: o teste so opera contra `http://127.0.0.1:54321`. Se o stack local
 * nao existir, o teste e marcado como NAO EXECUTAVEL (skip explicito) — nunca
 * aprovado silenciosamente.
 */

const PROJECT_ROOT = join(import.meta.dir, "..");
const G4_27B_MIGRATION = join(
  PROJECT_ROOT,
  "supabase/migrations/20261021042744_g4_27b_avatar_c2_private_bucket_and_guard_hardening.sql",
);

const ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
  "ANON_KEY",
  "SERVICE_ROLE_KEY",
  "VITE_APP_SUPABASE_URL",
  "VITE_APP_SUPABASE_PUBLISHABLE_KEY",
  "APP_SUPABASE_URL",
  "APP_SUPABASE_PUBLISHABLE_KEY",
] as const;

const resolved = await resolveLocalEnv();
const live = resolved !== null;

if (!live) {
  console.warn(
    "[G4.27E] Stack Supabase LOCAL indisponivel — o E2E de avatar em bucket privado NAO foi executado (skip explicito).",
  );
}

describe.skipIf(!live)("G4.27E — E2E local do avatar em bucket privado", () => {
  let env!: { url: string; anonKey: string; serviceRoleKey: string };
  let stack: LocalStack | null = null;
  let admin!: SupabaseClient;
  let fixture!: AvatarFixture;
  let viewer!: SchemaAClient;
  let snapshot: PrivateBucketRestore | null = null;
  const originalEnv = new Map<string, string | undefined>();

  const service = (client: SchemaAClient = viewer, id: string = fixture.viewerId) =>
    createServerAvatarMediaUrlService({
      supabase: client,
      viewerId: id,
      trustedOrigin: new URL(env.url).origin,
    });

  beforeAll(async () => {
    if (!resolved) throw new Error("stack local indisponivel");
    env = resolved.env;
    stack = resolved.stack;

    if (!isLocalStackUrl(env.url)) {
      throw new Error(`Abortado: URL alvo nao e local (${new URL(env.url).origin})`);
    }

    for (const key of ENV_KEYS) originalEnv.set(key, process.env[key]);
    process.env.SUPABASE_URL = env.url;
    process.env.SUPABASE_SERVICE_ROLE_KEY = env.serviceRoleKey;
    process.env.ANON_KEY = env.anonKey;
    process.env.SERVICE_ROLE_KEY = env.serviceRoleKey;
    process.env.VITE_APP_SUPABASE_URL = env.url;
    process.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY = env.anonKey;
    process.env.APP_SUPABASE_URL = env.url;
    process.env.APP_SUPABASE_PUBLISHABLE_KEY = env.anonKey;

    // O cliente admin do app (`supabaseAdmin`) e lazy: forcamos a criacao AGORA,
    // com o env local ja aplicado, para garantir que ele aponte para o stack local.
    const { supabaseAdmin } = await import("../src/integrations/supabase/client.server");
    const adminStorageUrl = (supabaseAdmin.storage as unknown as { url?: string }).url;
    if (typeof adminStorageUrl === "string" && !adminStorageUrl.startsWith(env.url)) {
      throw new Error("Abortado: cliente admin do app nao aponta para o stack local");
    }

    admin = createClient(env.url, env.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (!stack) {
      throw new Error("stack local sem container de banco: nao e possivel privatizar o bucket local");
    }

    // Snapshot + aplicacao da migration REPO que privatiza o bucket `avatars`
    // (a mesma que o remoto recebeu). O `afterAll` restaura o estado exato.
    const migrationSql = await readFile(G4_27B_MIGRATION, "utf8");
    snapshot = await privatizeLocalAvatarBucket(stack, migrationSql);

    fixture = await createAvatarFixture(env, admin);
    viewer = fixture.viewer;
  });

  afterAll(async () => {
    if (admin && fixture) {
      const cleanupErrors = await cleanupAvatarFixture(admin, fixture);
      if (cleanupErrors.length > 0) {
        console.error(`[G4.27E] cleanup com falhas: ${cleanupErrors.join(" | ")}`);
      }
    }

    if (stack && snapshot) {
      try {
        await restoreLocalAvatarBucket(stack, snapshot);
      } catch (error) {
        console.error("[G4.27E] falha ao restaurar o estado local do banco", error);
      }
    }

    for (const key of ENV_KEYS) {
      const original = originalEnv.get(key);
      if (original === undefined) delete process.env[key];
      else process.env[key] = original;
    }
  });

  test("pre-condicao: o bucket local `avatars` esta PRIVADO e sem leitura publica", async () => {
    if (!stack) throw new Error("sem container local");
    const publicFlag = await queryLocalPsql(
      stack.dbContainer,
      "select public::text from storage.buckets where id = 'avatars';",
    );
    expect(publicFlag).toBe("false");

    const publicPolicy = await queryLocalPsql(
      stack.dbContainer,
      "select count(*) from pg_policy where polname = 'Avatars public read';",
    );
    expect(publicPolicy).toBe("0");

    // Nenhuma policy de SELECT no bucket `avatars` pode ser concedida a
    // `public`/`anon` depois da privatizacao.
    const leakyRead = await queryLocalPsql(
      stack.dbContainer,
      `select coalesce(string_agg(p.polname, ','), '') from pg_policy p
        where p.polcmd = 'r'
          and (
            0 = any(p.polroles)
            or exists (
              select 1 from unnest(p.polroles) rr join pg_roles r on r.oid = rr
              where r.rolname in ('public', 'anon')
            )
          )
          and pg_get_expr(p.polqual, p.polrelid) like '%avatars%';`,
    );
    expect(leakyRead).toBe("");

    // A policy de leitura autenticada permanece (acesso direto de logado).
    const authenticatedRead = await queryLocalPsql(
      stack.dbContainer,
      "select count(*) from pg_policy where polname = 'Avatars authenticated read' and polcmd = 'r';",
    );
    expect(Number(authenticatedRead)).toBeGreaterThan(0);

    const buckets = await admin.storage.listBuckets();
    const avatars = buckets.data?.find((bucket) => bucket.id === AVATAR_BUCKET);
    expect(avatars?.public).toBe(false);
  });

  test("usuario autenticado obtem URL assinada e CARREGA a imagem real (decodificada)", async () => {
    const verified = await verifySupabaseBearer(`Bearer ${fixture.viewerToken}`, {
      url: env.url,
      key: env.anonKey,
    });
    expect(verified.userId).toBe(fixture.viewerId);

    const result = await service().getAvatarUrl(fixture.viewerId);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("avatar nao autorizado");

    expect(result.url).toContain(`/storage/v1/object/sign/${AVATAR_BUCKET}/`);
    expect(result.url).not.toContain("/storage/v1/object/public/");
    expect(new URL(result.url).origin).toBe(new URL(env.url).origin);
    expect(result.expiresAt).toBeGreaterThan(Date.now());
    expect(result.expiresAt).toBeLessThanOrEqual(
      Date.now() + AVATAR_MEDIA_URL_TTL_SECONDS * 1000 + 5_000,
    );

    // Carregamento real da imagem + decodificacao.
    const response = await fetch(result.url);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(bytes.length).toBe(fixture.png.bytes.length);

    const decoded = decodePng(bytes);
    expect(decoded.width).toBe(fixture.png.width);
    expect(decoded.height).toBe(fixture.png.height);
    expect(decoded.bitDepth).toBe(8);
    expect(decoded.colorType).toBe(2);
    expect(Array.from(decoded.raw)).toEqual(Array.from(fixture.png.raw));
  });

  test("o token da URL assinada e o credencial: sem sessao, mas com a URL, a imagem carrega", async () => {
    const result = await service().getAvatarUrl(fixture.viewerId);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("avatar nao autorizado");

    const response = await fetch(result.url);
    expect(response.status).toBe(200);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const decoded = decodePng(bytes);
    expect(decoded.width).toBe(fixture.png.width);
    expect(decoded.height).toBe(fixture.png.height);
  });

  test("o objeto do padrao do app (`.jpg`) tambem e assinado e baixado intacto", async () => {
    const update = await viewer
      .from("profiles")
      .update({ photo_url: fixture.jpegPath })
      .eq("id", fixture.viewerId)
      .select("photo_url")
      .single();
    if (update.error) throw update.error;

    const result = await service().getAvatarUrl(fixture.viewerId);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("avatar nao autorizado");

    const response = await fetch(result.url);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/jpeg");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(bytes)).toEqual(Array.from(JPEG_1X1_BYTES));

    // volta para o fixture PNG (usado pelos demais testes)
    const back = await viewer
      .from("profiles")
      .update({ photo_url: fixture.canonicalPath })
      .eq("id", fixture.viewerId)
      .select("photo_url")
      .single();
    if (back.error) throw back.error;
  });

  test("a URL assinada NAO e persistida no perfil", async () => {
    const result = await service().getAvatarUrl(fixture.viewerId);
    expect(result.status).toBe("ready");
    const stored = await viewer
      .from("profiles")
      .select("photo_url")
      .eq("id", fixture.viewerId)
      .maybeSingle();
    if (stored.error) throw stored.error;
    expect(stored.data?.photo_url).toBe(fixture.canonicalPath);
    expect(stored.data?.photo_url).not.toContain("token=");
  });

  test("sem sessao, o servico recusa e nao produz URL assinada", async () => {
    const anonymous = createServerAvatarMediaUrlService({
      supabase: createSchemaAClient(env.url, env.anonKey),
      viewerId: null,
      trustedOrigin: new URL(env.url).origin,
    });
    const result = await anonymous.getAvatarUrl(fixture.viewerId);
    expect(result.status).toBe("forbidden");
    expect("url" in result).toBe(false);
  });

  test("o middleware real rejeita requisicao sem Authorization e com token invalido", async () => {
    await expect(verifySupabaseBearer(null, { url: env.url, key: env.anonKey })).rejects.toThrow(
      "No authorization header provided",
    );
    await expect(
      verifySupabaseBearer("Basic abc", { url: env.url, key: env.anonKey }),
    ).rejects.toThrow("Only Bearer tokens are supported");
    await expect(
      verifySupabaseBearer("Bearer nao-e-um-jwt", { url: env.url, key: env.anonKey }),
    ).rejects.toThrow("Invalid token");
  });

  test("acesso anonimo ao objeto privado e REJEITADO", async () => {
    const publicPath = `${env.url}/storage/v1/object/public/${AVATAR_BUCKET}/${fixture.canonicalPath}`;
    const viaPublic = await fetch(publicPath);
    expect(viaPublic.status).not.toBe(200);
    const publicBody = new Uint8Array(await viaPublic.arrayBuffer());
    expect(Array.from(publicBody.slice(0, 8))).not.toEqual(Array.from(PNG_SIGNATURE));

    const viaApi = await fetch(
      `${env.url}/storage/v1/object/${fixture.canonicalPath}?bucket=${AVATAR_BUCKET}`,
      { headers: { apikey: env.anonKey } },
    );
    expect(viaApi.status).not.toBe(200);

    const anonClient = createSchemaAClient(env.url, env.anonKey);
    const download = await anonClient.storage.from(AVATAR_BUCKET).download(fixture.canonicalPath);
    expect(download.error).not.toBeNull();
    expect(download.data).toBeNull();
  });

  test("acesso DIRETO de um usuario autenticado continua permitido (policy de leitura)", async () => {
    const download = await viewer.storage.from(AVATAR_BUCKET).download(fixture.canonicalPath);
    expect(download.error).toBeNull();
    if (!download.data) throw new Error("download autenticado vazio");
    const bytes = new Uint8Array(await download.data.arrayBuffer());
    const decoded = decodePng(bytes);
    expect(decoded.width).toBe(fixture.png.width);
    expect(decoded.height).toBe(fixture.png.height);
  });

  test("URL assinada adulterada e REJEITADA", async () => {
    const result = await service().getAvatarUrl(fixture.viewerId);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("avatar nao autorizado");

    // Altera UM caractere no MEIO do token: os ultimos bits de um JWT base64url
    // podem ser "padding" e nao alterar os bytes decodificados (a assinatura
    // continuaria valida) — por isso a mutacao acontece no miolo do token.
    const tampered = result.url.replace(/token=([^&]+)/, (_match, token: string) => {
      const index = Math.floor(token.length / 2);
      const original = token[index];
      const flipped = original === "A" ? "B" : "A";
      return `token=${token.slice(0, index)}${flipped}${token.slice(index + 1)}`;
    });
    expect(tampered).not.toBe(result.url);
    const response = await fetch(tampered);
    expect(response.status).not.toBe(200);
    const body = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(body.slice(0, 8))).not.toEqual(Array.from(PNG_SIGNATURE));
  });

  test("URL assinada EXPIRADA e rejeitada pelo Storage", async () => {
    const signed = await admin.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(fixture.canonicalPath, 1);
    expect(signed.error).toBeNull();
    const url = signed.data?.signedUrl;
    if (!url) throw new Error("signed url ausente");

    const before = await fetch(url);
    expect(before.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 2_500));
    const after = await fetch(url);
    expect(after.status).not.toBe(200);
    const body = new Uint8Array(await after.arrayBuffer());
    expect(Array.from(body.slice(0, 8))).not.toEqual(Array.from(PNG_SIGNATURE));
  });

  test("perfil sem avatar devolve 'missing' e caminho de outro dono devolve 'unavailable'", async () => {
    const cleared = await viewer
      .from("profiles")
      .update({ photo_url: null })
      .eq("id", fixture.viewerId)
      .select("photo_url")
      .single();
    if (cleared.error) throw cleared.error;
    expect((await service().getAvatarUrl(fixture.viewerId)).status).toBe("missing");

    const foreign = await viewer
      .from("profiles")
      .update({ photo_url: `${fixture.otherId}/${crypto.randomUUID()}.png` })
      .eq("id", fixture.viewerId)
      .select("photo_url")
      .single();
    if (foreign.error) throw foreign.error;
    expect((await service().getAvatarUrl(fixture.viewerId)).status).toBe("unavailable");

    const restored = await viewer
      .from("profiles")
      .update({ photo_url: fixture.canonicalPath })
      .eq("id", fixture.viewerId)
      .select("photo_url")
      .single();
    if (restored.error) throw restored.error;
  });

  test("outro usuario AUTENTICADO tambem consegue o avatar (contrato vigente)", async () => {
    const other = service(
      createSchemaAClient(env.url, env.anonKey, { accessToken: fixture.otherToken }),
      fixture.otherId,
    );
    const result = await other.getAvatarUrl(fixture.viewerId);
    expect(result.status).toBe("ready");
  });

  test("o bucket continua PRIVADO ao final do fluxo (nada foi tornado publico)", async () => {
    if (!stack) throw new Error("sem container local");
    const publicFlag = await queryLocalPsql(
      stack.dbContainer,
      "select public::text from storage.buckets where id = 'avatars';",
    );
    expect(publicFlag).toBe("false");
    const publicPolicy = await queryLocalPsql(
      stack.dbContainer,
      "select count(*) from pg_policy where polname = 'Avatars public read';",
    );
    expect(publicPolicy).toBe("0");
  });

  test("o caminho exercitado e o mesmo do aplicativo (fonte)", async () => {
    const functions = await readFile(
      join(PROJECT_ROOT, "src/lib/media/avatar-media.functions.ts"),
      "utf8",
    );
    expect(functions).toContain("requireAppSupabaseAuth");
    expect(functions).toContain("createServerAvatarMediaUrlService");
    expect(functions).toContain("Bearer ");
    expect(functions).not.toContain("getPublicUrl");

    const authorization = await readFile(
      join(PROJECT_ROOT, "src/lib/media/avatar-media-authorization.server.ts"),
      "utf8",
    );
    expect(authorization).toContain("createSignedUrl");
    expect(authorization).not.toContain("getPublicUrl");

    const component = await readFile(
      join(PROJECT_ROOT, "src/components/media/authenticated-avatar-image.tsx"),
      "utf8",
    );
    expect(component).toContain("getAvatarMediaUrl");
    expect(component).toContain("<img");

    const upload = await readFile(join(PROJECT_ROOT, "src/services/upload.service.ts"), "utf8");
    expect(upload).toContain("`${userId}/${crypto.randomUUID()}.${ext}`");
    expect(upload).toContain("BUCKETS.avatars");
  });
});
