import { deflateSync, inflateSync } from "node:zlib";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSchemaAClient, type SchemaAClient } from "../../src/integrations/supabase/remote";
import { AVATAR_BUCKET } from "../../src/lib/media/avatar-media";
import { queryLocalPsql, runLocalPsql, type LocalStack } from "./g4-27e-local-stack";

/**
 * G4.27E — fixtures compartilhados entre o E2E de servidor e o E2E de navegador.
 *
 * Nada aqui usa mock: as imagens sao geradas byte a byte (PNG real com IHDR/IDAT
 * calculados) e o bucket e manipulado no stack Supabase LOCAL.
 */

export const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** JPEG 1x1 valido (base64). Replica o padrao do app, que grava `.jpg`. */
export const JPEG_1X1_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIs" +
  "IxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAA" +
  "AAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

export const JPEG_1X1_BYTES = Uint8Array.from(Buffer.from(JPEG_1X1_BASE64, "base64"));

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

export type PngFixture = { bytes: Uint8Array; raw: Uint8Array; width: number; height: number };

/** Gera um PNG RGB valido (8x6 por padrao) com pixels deterministicos. */
export function buildPng(width = 8, height = 6): PngFixture {
  const raw = new Uint8Array(height * (1 + width * 3));
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    raw[offset] = 0; // filtro "none"
    offset += 1;
    for (let x = 0; x < width; x += 1) {
      raw[offset] = (x * 37 + 11) & 0xff;
      raw[offset + 1] = (y * 53 + 29) & 0xff;
      raw[offset + 2] = (x * 17 + y * 31 + 7) & 0xff;
      offset += 3;
    }
  }
  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const bytes = concatBytes([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", new Uint8Array(deflateSync(raw))),
    pngChunk("IEND", new Uint8Array(0)),
  ]);
  return { bytes, raw, width, height };
}

export type DecodedPng = {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  raw: Uint8Array;
};

/** Decodifica um PNG real: assinatura, chunks, IHDR e inflate do IDAT. */
export function decodePng(bytes: Uint8Array): DecodedPng {
  for (let i = 0; i < PNG_SIGNATURE.length; i += 1) {
    if (bytes[i] !== PNG_SIGNATURE[i]) throw new Error("assinatura PNG ausente");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Uint8Array[] = [];
  let sawIend = false;
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      sawIend = true;
      break;
    }
    offset += 12 + length;
  }
  if (!sawIend) throw new Error("chunk IEND ausente");
  const raw = new Uint8Array(inflateSync(Buffer.concat(idat.map((part) => Buffer.from(part)))));
  return { width, height, bitDepth, colorType, raw };
}

/** Le a dimensao declarada no frame header SOF de um JPEG. */
export function readJpegDimensions(bytes: Uint8Array): { width: number; height: number } {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("SOI JPEG ausente");
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error("marcador JPEG invalido");
    const marker = bytes[offset + 1];
    if (marker === 0xd9) break; // EOI
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return {
        height: (bytes[offset + 5] << 8) | bytes[offset + 6],
        width: (bytes[offset + 7] << 8) | bytes[offset + 8],
      };
    }
    offset += 2 + length;
  }
  throw new Error("SOF JPEG ausente");
}

// ---------------------------------------------------------------------------
// Bucket privado (aplica/restaura a migration C2 no stack LOCAL)
// ---------------------------------------------------------------------------

export type PrivateBucketRestore = {
  bucketPublic: string;
  policyDef: string | null;
  guardDef: string | null;
};

/** Reconstitui o DDL de uma policy a partir das colunas da view `pg_policies`. */
export function buildCreatePolicy(policyName: string, row: string): string {
  const [cmd, roles, qual, withCheck] = row.split("|");
  const cmdMap: Record<string, string> = {
    r: "SELECT",
    a: "INSERT",
    w: "UPDATE",
    d: "DELETE",
  };
  const roleList = (roles ?? "")
    .replace(/[{}]/g, "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  const roleClause = roleList.length > 0 ? ` TO ${roleList.join(", ")}` : "";
  const usingClause = qual ? ` USING (${qual})` : "";
  const checkClause = withCheck ? ` WITH CHECK (${withCheck})` : "";
  return `CREATE POLICY "${policyName}" ON storage.objects FOR ${cmdMap[cmd] ?? cmd}${roleClause}${usingClause}${checkClause};`;
}

/**
 * Aplica a migration REPO que privatiza o bucket `avatars` no stack LOCAL e
 * devolve o snapshot necessario para restaurar o estado EXATO anterior.
 */
export async function privatizeLocalAvatarBucket(
  stack: LocalStack,
  migrationSql: string,
): Promise<PrivateBucketRestore> {
  const snapshot: PrivateBucketRestore = {
    bucketPublic: await queryLocalPsql(
      stack.dbContainer,
      "select public::text from storage.buckets where id = 'avatars';",
    ),
    policyDef:
      (
        await queryLocalPsql(
          stack.dbContainer,
          `select cmd || '|' || coalesce(roles::text, '') || '|' || coalesce(qual, '') || '|' || coalesce(with_check, '')
             from pg_policies
            where schemaname = 'storage' and tablename = 'objects' and policyname = 'Avatars public read';`,
        )
      ).trim() || null,
    guardDef:
      (
        await queryLocalPsql(
          stack.dbContainer,
          "select coalesce(pg_get_functiondef(p.oid), '') from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'private' and p.proname = 'g4_26b_is_canonical_avatar_path';",
        )
      ).trim() || null,
  };

  await runLocalPsql(stack.dbContainer, `begin;\n${migrationSql}\ncommit;\n`);
  return snapshot;
}

/** Restaura o snapshot do bucket (estado EXATO anterior a migration C2). */
export async function restoreLocalAvatarBucket(
  stack: LocalStack,
  snapshot: PrivateBucketRestore,
): Promise<void> {
  const restore = [
    "begin;",
    "drop function if exists private.g4_26b_is_canonical_avatar_path(text);",
    `update storage.buckets set public = ${snapshot.bucketPublic} where id = 'avatars';`,
    'drop policy if exists "Avatars public read" on storage.objects;',
    snapshot.policyDef ? buildCreatePolicy("Avatars public read", snapshot.policyDef) : "",
    snapshot.guardDef ? `${snapshot.guardDef};` : "",
    "commit;",
  ]
    .filter(Boolean)
    .join("\n");
  await runLocalPsql(stack.dbContainer, restore);
}

// ---------------------------------------------------------------------------
// Fixture de usuario + imagem
// ---------------------------------------------------------------------------

export type LocalEnv = { url: string; anonKey: string; serviceRoleKey: string };

export type AvatarFixture = {
  viewerId: string;
  viewerToken: string;
  otherId: string;
  otherToken: string;
  canonicalPath: string;
  jpegPath: string;
  png: PngFixture;
  viewer: SchemaAClient;
  email: string;
  password: string;
};

/**
 * Cria (no stack LOCAL) o usuario de teste, faz login real, sobe uma imagem PNG
 * e uma JPEG no bucket `avatars` usando a SESSAO do usuario (RLS de upload) e
 * persiste o caminho canonico em `profiles.photo_url`.
 */
export async function createAvatarFixture(env: LocalEnv, admin: SupabaseClient): Promise<AvatarFixture> {
  const stamp = Date.now();
  const email = `g4-27e-${stamp}@local.test`;
  const password = "g4-27e-local-pass";

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "G4.27E Avatar E2E" },
  });
  if (created.error || !created.data.user) {
    throw created.error ?? new Error("criacao do usuario local falhou");
  }
  const viewerId = created.data.user.id;

  const other = await admin.auth.admin.createUser({
    email: `g4-27e-other-${stamp}@local.test`,
    password,
    email_confirm: true,
    user_metadata: { name: "G4.27E Other" },
  });
  if (other.error || !other.data.user) {
    throw other.error ?? new Error("criacao do 2o usuario local falhou");
  }
  const otherId = other.data.user.id;

  const signIn = await createSchemaAClient(env.url, env.anonKey).auth.signInWithPassword({
    email,
    password,
  });
  if (signIn.error || !signIn.data.session) throw signIn.error ?? new Error("login local falhou");
  const viewerToken = signIn.data.session.access_token;

  const otherSignIn = await createSchemaAClient(env.url, env.anonKey).auth.signInWithPassword({
    email: `g4-27e-other-${stamp}@local.test`,
    password,
  });
  if (otherSignIn.error || !otherSignIn.data.session) {
    throw otherSignIn.error ?? new Error("login do 2o usuario local falhou");
  }
  const otherToken = otherSignIn.data.session.access_token;

  const viewer = createSchemaAClient(env.url, env.anonKey, { accessToken: viewerToken });

  // O trigger local `handle_new_user` cria o perfil; garantimos que ele existe.
  const profile = await viewer.from("profiles").select("id").eq("id", viewerId).maybeSingle();
  if (profile.error) throw profile.error;
  if (!profile.data) throw new Error("trigger nao criou o perfil do usuario de teste");

  const png = buildPng(8, 6);
  const canonicalPath = `${viewerId}/${crypto.randomUUID()}.png`;
  const jpegPath = `${viewerId}/${crypto.randomUUID()}.jpg`;

  const pngUpload = await viewer.storage
    .from(AVATAR_BUCKET)
    .upload(canonicalPath, new Blob([png.bytes], { type: "image/png" }), {
      contentType: "image/png",
      upsert: false,
    });
  if (pngUpload.error) throw pngUpload.error;

  const jpegUpload = await viewer.storage
    .from(AVATAR_BUCKET)
    .upload(jpegPath, new Blob([JPEG_1X1_BYTES], { type: "image/jpeg" }), {
      contentType: "image/jpeg",
      upsert: false,
    });
  if (jpegUpload.error) throw jpegUpload.error;

  const update = await viewer
    .from("profiles")
    .update({ photo_url: canonicalPath })
    .eq("id", viewerId)
    .select("photo_url")
    .single();
  if (update.error) throw update.error;
  if (update.data.photo_url !== canonicalPath) throw new Error("photo_url nao persistido");

  return {
    viewerId,
    viewerToken,
    otherId,
    otherToken,
    canonicalPath,
    jpegPath,
    png,
    viewer,
    email,
    password,
  };
}

/**
 * Remove o fixture. A ordem importa: `profile_private` -> `profiles` ->
 * `auth.users` sao FKs `ON DELETE RESTRICT` nesta base.
 */
export async function cleanupAvatarFixture(
  admin: SupabaseClient,
  fixture: Pick<AvatarFixture, "viewerId" | "otherId" | "canonicalPath" | "jpegPath">,
): Promise<string[]> {
  const errors: string[] = [];
  try {
    const removed = await admin.storage
      .from(AVATAR_BUCKET)
      .remove([fixture.canonicalPath, fixture.jpegPath]);
    if (removed.error) errors.push(`storage.remove: ${removed.error.message}`);
  } catch (error) {
    errors.push(`storage.remove: ${String(error)}`);
  }
  for (const id of [fixture.viewerId, fixture.otherId]) {
    if (!id) continue;
    try {
      const priv = await admin.from("profile_private").delete().eq("user_id", id);
      if (priv.error) errors.push(`profile_private.delete: ${priv.error.message}`);
      const profile = await admin.from("profiles").delete().eq("id", id);
      if (profile.error) errors.push(`profiles.delete: ${profile.error.message}`);
      const deleted = await admin.auth.admin.deleteUser(id);
      if (deleted.error) errors.push(`auth.deleteUser: ${deleted.error.message}`);
    } catch (error) {
      errors.push(`cleanup ${id}: ${String(error)}`);
    }
  }
  return errors;
}
