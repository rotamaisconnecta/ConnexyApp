import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  AVATAR_BUCKET,
  classifyAvatarRef,
  resolveAvatarDisplayUrl,
  type ClassifyAvatarOptions,
} from "../src/lib/media/avatar-media";

/**
 * G4.21 — contrato do classificador/resolvedor de avatar (offline).
 *
 * Estes testes verificam o CONTRATO de seguranca e compatibilidade, nao uma
 * reimplementacao: bucket permitido, origem confiavel, protocolo, isolamento de
 * dono, fail-closed e preservacao do formato ja persistido. Nao ha rede, cache
 * nem assinatura (a assinatura de avatar depende de decisao de privacidade ainda
 * pendente — ver relatorio G4.21).
 */

const projectRoot = join(import.meta.dir, "..");
const ORIGIN = "https://project.supabase.co";
const OPTIONS: ClassifyAvatarOptions = { trustedOrigin: ORIGIN };
const OWNER = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

const publicUrl = `${ORIGIN}/storage/v1/object/public/avatars/${OWNER}/avatar.jpg`;
const signedUrl = `${ORIGIN}/storage/v1/object/sign/avatars/${OWNER}/avatar.jpg?token=SECRET`;

describe("G4.21 classifyAvatarRef — ausencia, local e externo", () => {
  test("null, undefined e vazio viram 'missing'", () => {
    expect(classifyAvatarRef(null, OPTIONS)).toEqual({ kind: "missing" });
    expect(classifyAvatarRef(undefined, OPTIONS)).toEqual({ kind: "missing" });
    expect(classifyAvatarRef("", OPTIONS)).toEqual({ kind: "missing" });
    expect(classifyAvatarRef("   ", OPTIONS)).toEqual({ kind: "missing" });
  });

  test("nao-string e rejeitado", () => {
    expect(classifyAvatarRef(42, OPTIONS)).toEqual({ kind: "rejected", reason: "not-string" });
    expect(classifyAvatarRef({}, OPTIONS)).toEqual({ kind: "rejected", reason: "not-string" });
  });

  test("data: e blob: sao locais", () => {
    expect(classifyAvatarRef("data:image/png;base64,AAAA", OPTIONS)).toEqual({
      kind: "local",
      url: "data:image/png;base64,AAAA",
    });
    expect(classifyAvatarRef("blob:https://app/abc", OPTIONS)).toEqual({
      kind: "local",
      url: "blob:https://app/abc",
    });
  });

  test("URL HTTPS externa valida e 'external'", () => {
    expect(classifyAvatarRef("https://images.unsplash.com/photo-123?w=400", OPTIONS)).toEqual({
      kind: "external",
      url: "https://images.unsplash.com/photo-123?w=400",
    });
  });
});

describe("G4.21 classifyAvatarRef — Storage de avatar", () => {
  test("URL publica do bucket avatars e 'storage-public' e descarta query no path", () => {
    expect(classifyAvatarRef(publicUrl, OPTIONS)).toEqual({
      kind: "storage-public",
      bucket: AVATAR_BUCKET,
      path: `${OWNER}/avatar.jpg`,
      url: publicUrl,
    });
  });

  test("URL assinada legada e 'storage-signed' (token fora do path, URL preservada)", () => {
    const ref = classifyAvatarRef(signedUrl, OPTIONS);
    expect(ref).toEqual({
      kind: "storage-signed",
      bucket: AVATAR_BUCKET,
      path: `${OWNER}/avatar.jpg`,
      url: signedUrl,
    });
  });

  test("URL assinada expirada NAO e convertida em publica (mesma classificacao)", () => {
    const expired =
      `${ORIGIN}/storage/v1/object/sign/avatars/${OWNER}/old.jpg` +
      "?token=eyJhbGciOiJIUzI1NiJ9.expired.sig";
    const ref = classifyAvatarRef(expired, OPTIONS);
    expect(ref.kind).toBe("storage-signed");
    if (ref.kind === "storage-signed") expect(ref.url).toBe(expired);
  });

  test("bucket nao permitido e rejeitado", () => {
    const foreign = `${ORIGIN}/storage/v1/object/public/bio-media/${OWNER}/x.jpg`;
    expect(classifyAvatarRef(foreign, OPTIONS)).toEqual({
      kind: "rejected",
      reason: "storage-foreign-bucket",
    });
    const reels = `${ORIGIN}/storage/v1/object/public/reels-media/${OWNER}/x.mp4`;
    expect(classifyAvatarRef(reels, OPTIONS)).toEqual({
      kind: "rejected",
      reason: "storage-foreign-bucket",
    });
  });

  test("URL no proprio dominio de Storage mas sem forma valida e fail-closed", () => {
    expect(classifyAvatarRef(`${ORIGIN}/rest/v1/profiles?id=1`, OPTIONS)).toEqual({
      kind: "rejected",
      reason: "unrecognized",
    });
    expect(classifyAvatarRef(`${ORIGIN}/storage/v1/object/public/avatars/`, OPTIONS)).toEqual({
      kind: "rejected",
      reason: "unrecognized",
    });
  });
});

describe("G4.21 classifyAvatarRef — caminho canonico", () => {
  test("caminho {uuid}/{arquivo}.{ext} vira 'canonical' com ownerId", () => {
    expect(classifyAvatarRef(`${OWNER}/avatar.jpg`, OPTIONS)).toEqual({
      kind: "canonical",
      bucket: AVATAR_BUCKET,
      path: `${OWNER}/avatar.jpg`,
      ownerId: OWNER,
    });
  });

  test("caminho invalido (sem uuid/ extensao) e rejeitado", () => {
    expect(classifyAvatarRef("lucas/avatar.jpg", OPTIONS)).toEqual({
      kind: "rejected",
      reason: "invalid-path",
    });
    expect(classifyAvatarRef(`${OWNER}/avatar`, OPTIONS)).toEqual({
      kind: "rejected",
      reason: "invalid-path",
    });
    expect(classifyAvatarRef(`../${OWNER}/avatar.jpg`, OPTIONS)).toEqual({
      kind: "rejected",
      reason: "invalid-path",
    });
  });
});

describe("G4.21 classifyAvatarRef — protocolo e isolamento de dono", () => {
  test("protocolo nao HTTP(S) e rejeitado", () => {
    expect(classifyAvatarRef("javascript:alert(1)", OPTIONS)).toEqual({
      kind: "rejected",
      reason: "non-http-protocol",
    });
    expect(classifyAvatarRef("ftp://x/avatar.jpg", OPTIONS)).toEqual({
      kind: "rejected",
      reason: "non-http-protocol",
    });
  });

  test("URL HTTP(S) malformada e rejeitada", () => {
    expect(classifyAvatarRef("https://", OPTIONS)).toEqual({
      kind: "rejected",
      reason: "unrecognized",
    });
    expect(classifyAvatarRef("https://[bad", OPTIONS)).toEqual({
      kind: "rejected",
      reason: "unrecognized",
    });
  });

  test("expectedOwnerId bloqueia caminho e URL de outro dono", () => {
    expect(
      classifyAvatarRef(`${OTHER}/avatar.jpg`, { ...OPTIONS, expectedOwnerId: OWNER }),
    ).toEqual({ kind: "rejected", reason: "foreign-owner" });
    const otherPublic = `${ORIGIN}/storage/v1/object/public/avatars/${OTHER}/avatar.jpg`;
    expect(classifyAvatarRef(otherPublic, { ...OPTIONS, expectedOwnerId: OWNER })).toEqual({
      kind: "rejected",
      reason: "foreign-owner",
    });
    expect(
      classifyAvatarRef(`${OWNER}/avatar.jpg`, { ...OPTIONS, expectedOwnerId: OWNER }),
    ).toEqual({
      kind: "canonical",
      bucket: AVATAR_BUCKET,
      path: `${OWNER}/avatar.jpg`,
      ownerId: OWNER,
    });
  });

  test("sem trustedOrigin configurado, nada e tratado como Storage", () => {
    expect(classifyAvatarRef(publicUrl, { trustedOrigin: null })).toEqual({
      kind: "external",
      url: publicUrl,
    });
  });
});

describe("G4.21 resolveAvatarDisplayUrl — compatibilidade e fallback", () => {
  test("preserva a URL ja persistida (publica, assinada, externa, local)", () => {
    expect(resolveAvatarDisplayUrl(publicUrl, OPTIONS)).toBe(publicUrl);
    expect(resolveAvatarDisplayUrl(signedUrl, OPTIONS)).toBe(signedUrl);
    const ext = "https://images.unsplash.com/photo-1?w=100";
    expect(resolveAvatarDisplayUrl(ext, OPTIONS)).toBe(ext);
    expect(resolveAvatarDisplayUrl("data:image/png;base64,AAAA", OPTIONS)).toBe(
      "data:image/png;base64,AAAA",
    );
  });

  test("caminho canonico, ausencia e rejeitado devolvem null (fallback local)", () => {
    expect(resolveAvatarDisplayUrl(`${OWNER}/avatar.jpg`, OPTIONS)).toBeNull();
    expect(resolveAvatarDisplayUrl(null, OPTIONS)).toBeNull();
    expect(resolveAvatarDisplayUrl("", OPTIONS)).toBeNull();
    expect(resolveAvatarDisplayUrl("javascript:alert(1)", OPTIONS)).toBeNull();
    expect(resolveAvatarDisplayUrl("https://[bad", OPTIONS)).toBeNull();
  });
});

describe("G4.21 modulo offline — sem rede, cache, assinatura ou credencial", () => {
  test("nao usa rede, console, cache, assinatura nem credencial privilegiada", async () => {
    const text = await readFile(join(projectRoot, "src/lib/media/avatar-media.ts"), "utf8");
    expect(text.includes("fetch(")).toBe(false);
    expect(text.includes("console.")).toBe(false);
    expect(text.includes("createSignedUrl")).toBe(false);
    expect(text.includes("service_role")).toBe(false);
    expect(text.includes("supabase")).toBe(false);
    expect(text.includes("await ")).toBe(false);
  });
});
