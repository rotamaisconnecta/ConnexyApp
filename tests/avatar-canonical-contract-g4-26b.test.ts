import { describe, expect, test } from "bun:test";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { UploadService } from "../src/services/upload.service";
import {
  AVATAR_BUCKET,
  classifyAvatarRef,
  resolveAvatarDisplayUrl,
} from "../src/lib/media/avatar-media";

/**
 * G4.26B — contrato canônico de avatar na persistência e na descoberta.
 *
 * Escopo (offline, sem rede/DB):
 *  - Escritores ativos persistem CAMINHO CANÔNICO (`{uid}/{uuid}.ext`) validado,
 *    não URL pública.
 *  - O removedor de objeto antigo entende o caminho canônico.
 *  - A RPC `get_nearby_profiles` deixa de entregar URL pública bruta: só devolve
 *    o valor quando ele é caminho canônico; caso contrário `NULL`.
 *
 * Não há conexão remota, migração aplicada, backfill nem alteração de bucket.
 */

const projectRoot = join(import.meta.dir, "..");
const OWNER = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const OBJECT = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.jpg";
const CANONICAL = `${OWNER}/${OBJECT}`;

async function read(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

describe("G4.26B escritor bio-avatar persiste caminho canônico", () => {
  test("não publica nem persiste URL pública", async () => {
    const source = await read("src/components/bio/bio-avatar.tsx");
    expect(source.includes("getPublicUrl")).toBe(false);
    expect(source.includes("publicUrl")).toBe(false);
    expect(source.includes("supabase.storage")).toBe(false);
  });

  test("persiste o path retornado pelo uploadAvatar e valida o dono", async () => {
    const source = await read("src/components/bio/bio-avatar.tsx");
    expect(source.includes("UploadService.uploadAvatar(userId, avatarFile)")).toBe(true);
    expect(source.includes("photo_url: path")).toBe(true);
    expect(source.includes("validateMediaPath(path)")).toBe(true);
    expect(source.includes("validation.ownerId !== userId")).toBe(true);
  });

  test("remove o upload recém-enviado se a validação falhar", async () => {
    const source = await read("src/components/bio/bio-avatar.tsx");
    expect(source.includes("UploadService.deleteFile(BUCKETS.avatars, [path])")).toBe(true);
  });
});

describe("G4.26B escritor de cadastro persiste caminho canônico", () => {
  test("ramo legado não usa mais getPublicUrl", async () => {
    const source = await read("src/routes/completar-perfil.tsx");
    expect(source.includes("getPublicUrl")).toBe(false);
    expect(source.includes("urlData.publicUrl")).toBe(false);
    expect(source.includes("photoUrl = path")).toBe(true);
    expect(source.includes("validation.ownerId !== user.id")).toBe(true);
  });
});

describe("G4.26B removível de objeto entende caminho canônico", () => {
  test("extrai caminho canônico diretamente", () => {
    expect(UploadService.extractStoragePathFromUrl(CANONICAL)).toBe(CANONICAL);
  });

  test("continua extraindo de URL pública e rejeitando formatos inválidos", () => {
    const publicUrl = `https://project.supabase.co/storage/v1/object/public/avatars/${CANONICAL}`;
    expect(UploadService.extractStoragePathFromUrl(publicUrl)).toBe(CANONICAL);
    expect(UploadService.extractStoragePathFromUrl("not-a-uuid/photo.jpg")).toBeNull();
    expect(UploadService.extractStoragePathFromUrl("data:image/png;base64,AAAA")).toBeNull();
  });
});

describe("G4.26B valor canônico é exibível via resolução server-side", () => {
  test("classificador reconhece o valor persistido como canônico do próprio dono", () => {
    const ref = classifyAvatarRef(CANONICAL, { expectedOwnerId: OWNER });
    expect(ref.kind).toBe("canonical");
    if (ref.kind === "canonical") {
      expect(ref.bucket).toBe(AVATAR_BUCKET);
      expect(ref.ownerId).toBe(OWNER);
    }
  });

  test("resolver offline devolve null (exibição ocorre via componente autenticado)", () => {
    expect(resolveAvatarDisplayUrl(CANONICAL, { expectedOwnerId: OWNER })).toBeNull();
  });
});

describe("G4.26B migration restringe a RPC a caminho canônico", () => {
  test("existe uma migration versionada dedicada", async () => {
    const dir = join(projectRoot, "supabase/migrations");
    const entries = await readdir(dir);
    const found = entries.filter((name) =>
      name.includes("g4_26b_avatar_canonical_discovery_contract"),
    );
    expect(found.length).toBe(1);
  });

  test("preserva a assinatura da RPC e projeta photo_url só quando canônico", async () => {
    const source = await read(
      "supabase/migrations/20261021042457_g4_26b_avatar_canonical_discovery_contract.sql",
    );
    // Mesma assinatura (compatibilidade dos consumidores).
    expect(source).toContain("p_radius_km double precision");
    expect(source).toContain("p_limit integer");
    expect(source).toContain("photo_url text");
    // Não entrega URL pública bruta: filtra por guard canônico.
    expect(source).toContain("private.g4_26b_is_canonical_avatar_path(s.photo_url)");
    expect(source).toContain("then btrim(s.photo_url) else null end");
    // Não abre acesso a anon/public.
    expect(source).toContain("from public, anon");
    expect(source).toContain("to authenticated");
  });

  test("G4.26D o guard rejeita caractere de controle (paridade com o validador TS)", async () => {
    const source = await read(
      "supabase/migrations/20261021042457_g4_26b_avatar_canonical_discovery_contract.sql",
    );
    expect(source).toContain("if v_value ~ '[\\x00-\\x1f\\x7f]' then");
    expect(source).toContain("immutable");
    expect(source).toContain("set search_path = ''");
  });

  test("não altera bucket, políticas, RLS ou faz backfill", async () => {
    const source = await read(
      "supabase/migrations/20261021042457_g4_26b_avatar_canonical_discovery_contract.sql",
    );
    expect(source.includes("insert into storage")).toBe(false);
    expect(source.includes("storage.buckets")).toBe(false);
    expect(source.includes("create policy")).toBe(false);
    expect(source.includes("update public.profiles")).toBe(false);
  });
});
