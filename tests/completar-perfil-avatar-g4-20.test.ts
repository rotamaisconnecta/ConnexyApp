import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { UploadService } from "../src/services/upload.service";

/**
 * G4.20 — o cadastro de perfil não pode mais persistir uma URL assinada de
 * longa duração em `profiles.photo_url`.
 *
 * O comportamento vive dentro do componente `completar-perfil.tsx` (fluxo de
 * formulário), então a verificação determinística é uma varredura estática do
 * arquivo combinada ao contrato de formato da referência persistida. O contrato
 * de exibição/remoção legado (que consome `photo_url` como URL) é coberto por
 * `UploadService.extractStoragePathFromUrl`.
 */

const projectRoot = join(import.meta.dir, "..");
const ROUTE = join(projectRoot, "src/routes/completar-perfil.tsx");

async function readRoute(): Promise<string> {
  return readFile(ROUTE, "utf8");
}

describe("G4.20 cadastro de perfil — sem URL assinada de longa duração", () => {
  test("o cadastro não chama createSignedUrl", async () => {
    const source = await readRoute();
    expect(source.includes("createSignedUrl")).toBe(false);
  });

  test("o cadastro não contém o TTL de cinco anos nem um TTL longo de assinatura", async () => {
    const source = await readRoute();
    expect(source.includes("365")).toBe(false);
    // Nenhum segundo de assinatura longo (ex.: 24h+ ) no arquivo.
    expect(source.includes("60 * 60 * 24")).toBe(false);
  });

  test("o cadastro persiste o caminho canônico do objeto (sem URL pública)", async () => {
    const source = await readRoute();
    expect(source.includes("getPublicUrl")).toBe(false);
    expect(source.includes("urlData.publicUrl")).toBe(false);
    // Persiste o path canônico validado (`{uid}/{uuid}.jpg`).
    expect(source.includes("photoUrl = path")).toBe(true);
    expect(source.includes("validateMediaPath(path)")).toBe(true);
    expect(source.includes("validation.ownerId !== user.id")).toBe(true);
  });

  test("o cadastro continua removendo o upload apenas em caso de falha", async () => {
    // Guarda de não-regressão: o rollback de upload segue presente.
    const source = await readRoute();
    expect(source.includes('from("avatars").remove([uploadedPath])')).toBe(true);
  });
});

describe("G4.20 compatibilidade da referência persistida", () => {
  const publicUrl =
    "https://project.supabase.co/storage/v1/object/public/avatars/" +
    "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.jpg";

  test("uma URL pública de avatar é extraível para o path canônico (remoção legada)", () => {
    expect(UploadService.extractStoragePathFromUrl(publicUrl)).toBe(
      "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.jpg",
    );
  });

  test("um caminho canônico persistido é extraível diretamente (remoção atual)", () => {
    const canonical =
      "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.jpg";
    expect(UploadService.extractStoragePathFromUrl(canonical)).toBe(canonical);
  });

  test("um caminho inválido persistido não é extraível (fail-closed)", () => {
    expect(UploadService.extractStoragePathFromUrl("not-a-uuid/photo.jpg")).toBeNull();
    expect(
      UploadService.extractStoragePathFromUrl("aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"),
    ).toBeNull();
    expect(UploadService.extractStoragePathFromUrl("../escape.jpg")).toBeNull();
  });

  test("uma URL assinada antiga NÃO é extraível pelo removedor (motivo do formato anterior)", () => {
    const signed =
      "https://project.supabase.co/storage/v1/object/sign/avatars/" +
      "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/cccccccc-cccc-4ccc-cccc-cccccccccccc.jpg" +
      "?token=redacted";
    expect(UploadService.extractStoragePathFromUrl(signed)).toBeNull();
  });

  test("referências legadas de outros formatos continuam sem lançar", () => {
    expect(UploadService.extractStoragePathFromUrl("")).toBeNull();
    expect(UploadService.extractStoragePathFromUrl("not-a-url")).toBeNull();
    expect(UploadService.extractStoragePathFromUrl("data:image/png;base64,AAAA")).toBeNull();
  });
});

describe("G4.26D extração de path de URL legada — defesa em profundidade (C-07)", () => {
  test("URL pública cujo path extraído é malformado é rejeitada (fail-closed)", () => {
    const base = "https://project.supabase.co/storage/v1/object/public/avatars/";
    expect(UploadService.extractStoragePathFromUrl(`${base}../../etc/passwd.jpg`)).toBeNull();
    expect(UploadService.extractStoragePathFromUrl(`${base}not-a-uuid/avatar.jpg`)).toBeNull();
    expect(UploadService.extractStoragePathFromUrl(`${base}owner/avatar`)).toBeNull();
    expect(UploadService.extractStoragePathFromUrl(`${base}a/%2e%2e/b.jpg`)).toBeNull();
  });

  test("URL pública com path canônico válido continua extraível", () => {
    const base = "https://project.supabase.co/storage/v1/object/public/avatars/";
    const owner = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
    const name = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.jpg";
    expect(UploadService.extractStoragePathFromUrl(`${base}${owner}/${name}`)).toBe(
      `${owner}/${name}`,
    );
  });
});
