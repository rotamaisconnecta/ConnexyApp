import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  bucketForKind,
  bucketSupportsKind,
  classifyMediaValue,
  classifyPostMedia,
  findMediaItem,
  normalizePostMedia,
  serializePostMediaItem,
} from "../src/lib/media/media-contract";
import {
  isMediaBucket,
  isOwnedMediaPath,
  parseStorageUrl,
  validateMediaPath,
} from "../src/lib/media/media-path";

const projectRoot = join(import.meta.dir, "..");
const UUID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const HOST = "https://proj.supabase.co";
const EVIL = "https://evil.example";

describe("G1 D-M2 path validation", () => {
  test("accepts owner-scoped relative paths with and without purpose segment", () => {
    expect(validateMediaPath(`${UUID}/photo.jpg`)).toEqual({
      ok: true,
      ownerId: UUID,
      extension: "jpg",
    });
    expect(validateMediaPath(`${UUID}/post/${OTHER}.webp`)).toEqual({
      ok: true,
      ownerId: UUID,
      extension: "webp",
    });
  });

  test("rejects absolute, traversal, backslash and missing owner", () => {
    expect(validateMediaPath("/etc/passwd").ok).toBe(false);
    expect(validateMediaPath(`${UUID}/../secret.jpg`).ok).toBe(false);
    expect(validateMediaPath(`${UUID}\\photo.jpg`).ok).toBe(false);
    expect(validateMediaPath("lucas/photo.jpg").ok).toBe(false);
    expect(validateMediaPath("").ok).toBe(false);
    expect(validateMediaPath(undefined).ok).toBe(false);
  });

  test("rejects empty segments, encoded octets and control chars", () => {
    expect(validateMediaPath(`${UUID}//a.jpg`)).toEqual({ ok: false, reason: "empty-segment" });
    expect(validateMediaPath(`${UUID}/a.jpg/`)).toEqual({ ok: false, reason: "empty-segment" });
    expect(validateMediaPath(`${UUID}/%2e%2e/x.jpg`)).toEqual({ ok: false, reason: "encoded" });
    expect(validateMediaPath(`${UUID}/a\u0000.jpg`)).toEqual({ ok: false, reason: "control" });
  });

  test("rejects missing or invalid extension", () => {
    expect(validateMediaPath(`${UUID}/noext`).ok).toBe(false);
    expect(validateMediaPath(`${UUID}/bad.extensiontoolong`).ok).toBe(false);
    expect(validateMediaPath(`${UUID}/a.`).ok).toBe(false);
  });

  test("ownership is derived from the first segment only", () => {
    expect(isOwnedMediaPath(`${UUID}/post/${OTHER}.jpg`, UUID)).toBe(true);
    expect(isOwnedMediaPath(`${UUID}/post/${OTHER}.jpg`, OTHER)).toBe(false);
    expect(isOwnedMediaPath(`${OTHER}/${UUID}/a.jpg`, UUID)).toBe(false);
    expect(isOwnedMediaPath(`lucas/x.jpg`, UUID)).toBe(false);
  });

  test("parseStorageUrl only accepts the trusted origin and drops the token", () => {
    expect(
      parseStorageUrl(`${HOST}/storage/v1/object/public/bio-media/${UUID}/a.jpg`, HOST),
    ).toEqual({
      bucket: "bio-media",
      path: `${UUID}/a.jpg`,
      visibility: "public",
    });
    const signed = parseStorageUrl(
      `${HOST}/storage/v1/object/sign/avatars/${UUID}/a.jpg?token=SECRET`,
      HOST,
    );
    expect(signed).toEqual({ bucket: "avatars", path: `${UUID}/a.jpg`, visibility: "signed" });
    expect(JSON.stringify(signed)).not.toContain("SECRET");
  });

  test("parseStorageUrl rejects foreign hosts, unknown markers and no trust config", () => {
    expect(
      parseStorageUrl(`${EVIL}/storage/v1/object/public/bio-media/${UUID}/a.jpg`, HOST),
    ).toBeNull();
    expect(parseStorageUrl(`${HOST}/other/path/${UUID}/a.jpg`, HOST)).toBeNull();
    expect(
      parseStorageUrl(`${HOST}/storage/v1/object/public/bio-media/${UUID}/a.jpg`, null),
    ).toBeNull();
    // marcador presente em host externo nao vira Storage confiavel
    expect(
      parseStorageUrl(`${EVIL}/x/storage/v1/object/public/bio-media/${UUID}/a.jpg`, HOST),
    ).toBeNull();
  });

  test("parseStorageUrl rejects encoded traversal, double-encoding and malformed encoding", () => {
    expect(
      parseStorageUrl(`${HOST}/storage/v1/object/public/bio-media/${UUID}/%2e%2e/secret.jpg`, HOST),
    ).toBeNull();
    expect(
      parseStorageUrl(`${HOST}/storage/v1/object/public/bio-media/${UUID}/%252e%252e/x.jpg`, HOST),
    ).toBeNull();
    expect(
      parseStorageUrl(`${HOST}/storage/v1/object/public/bio-media/${UUID}/%E0%A4%A.jpg`, HOST),
    ).toBeNull();
  });

  test("bucket helpers stay within the three existing buckets", () => {
    expect(isMediaBucket("bio-media")).toBe(true);
    expect(isMediaBucket("post-media")).toBe(false);
    expect(bucketForKind("video")).toBe("reels-media");
    expect(bucketForKind("image")).toBe("bio-media");
    expect(bucketSupportsKind("avatars", "video")).toBe(false);
    expect(bucketSupportsKind("reels-media", "video")).toBe(true);
  });
});

describe("G1 D-M1 media contract classification", () => {
  const opts = { trustedOrigin: HOST };

  test("canonical (bucket,path) is valid and never uses preview", () => {
    const ref = classifyMediaValue(
      {
        type: "image",
        bucket: "bio-media",
        path: `${UUID}/a.jpg`,
        preview: "data:image/png;base64,zzz",
      },
      opts,
    );
    expect(ref.state).toBe("valid");
    if (ref.state === "valid") {
      expect(ref.object.bucket).toBe("bio-media");
      expect(ref.object.path).toBe(`${UUID}/a.jpg`);
    }
  });

  test("legacy public and signed URLs are recognized only from the trusted origin", () => {
    const pub = classifyMediaValue(
      { type: "image", preview: `${HOST}/storage/v1/object/public/bio-media/${UUID}/a.jpg` },
      opts,
    );
    expect(pub.state).toBe("legacy-public");

    const signed = classifyMediaValue(
      {
        type: "image",
        preview: `${HOST}/storage/v1/object/sign/avatars/${UUID}/a.jpg?token=SECRET`,
      },
      opts,
    );
    expect(signed.state).toBe("legacy-signed");
    if (signed.state === "legacy-signed") expect(signed.url).toContain("SECRET");

    const evil = classifyMediaValue(
      { type: "image", preview: `${EVIL}/storage/v1/object/public/bio-media/${UUID}/a.jpg` },
      opts,
    );
    expect(evil.state).toBe("invalid");
  });

  test("local (data url / mediaId) and invalid are distinguished", () => {
    expect(classifyMediaValue({ type: "image", preview: "data:image/png;base64,x" }).state).toBe(
      "local",
    );
    expect(classifyMediaValue({ type: "video", mediaId: "media-1" }).state).toBe("local");
    expect(classifyMediaValue({ type: "image" }).state).toBe("invalid");
    expect(classifyMediaValue({ type: "image", preview: `${EVIL}/x.jpg` }).state).toBe("invalid");
    expect(classifyMediaValue({ type: "audio", path: `${UUID}/a.jpg` }).state).toBe("invalid");
    expect(classifyMediaValue(null).state).toBe("invalid");
  });

  test("L5: an HTTP(S) URL in the path field is invalid, never legacy", () => {
    const ref = classifyMediaValue(
      { type: "image", path: `${HOST}/storage/v1/object/public/bio-media/${UUID}/a.jpg` },
      opts,
    );
    expect(ref).toEqual({ state: "invalid", reason: "url-in-path" });
  });
});

describe("G1 D-M1 normalizePostMedia preserves items without preview", () => {
  test("keeps a canonical item that has no preview field", () => {
    const items = normalizePostMedia([
      { type: "image", bucket: "bio-media", path: `${UUID}/a.jpg` },
      { type: "video", mediaId: "media-1" },
      {
        type: "image",
        bucket: "bio-media",
        path: `${UUID}/b.jpg`,
        preview: "data:image/png;base64,x",
      },
    ]);
    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({ type: "image", bucket: "bio-media", path: `${UUID}/a.jpg` });
    expect(items[1]).toEqual({ type: "video", mediaId: "media-1" });
  });

  test("drops malformed items, URL-in-path and non-arrays", () => {
    expect(normalizePostMedia(null)).toEqual([]);
    expect(normalizePostMedia([null, 5, { type: "audio" }, { type: "image" }])).toEqual([]);
    expect(normalizePostMedia([{ type: "image", path: `${UUID}/a.jpg` }])).toEqual([]);
    expect(normalizePostMedia([{ type: "image", path: `${HOST}/x.jpg` }])).toEqual([]);
  });

  test("serialize omits undefined fields and round-trips", () => {
    const item = {
      type: "video" as const,
      bucket: "reels-media" as const,
      path: `${UUID}/v.mp4`,
      mediaId: "m",
    };
    const serialized = serializePostMediaItem(item);
    expect(serialized).toEqual({
      type: "video",
      bucket: "reels-media",
      path: `${UUID}/v.mp4`,
      mediaId: "m",
    });
    expect(Object.keys(serializePostMediaItem({ type: "image" }))).toEqual(["type"]);
  });
});

describe("G1 M1 shared normalization and stable identity", () => {
  const opts = { trustedOrigin: HOST };

  test("classifyPostMedia aligns client positions with server normalization when a malformed item precedes a valid one", () => {
    const media = [
      { type: "image" }, // malformado: descartado pela normalizacao
      { type: "image", bucket: "bio-media", path: `${UUID}/good.jpg` },
    ];
    const refs = classifyPostMedia(media, opts);
    expect(refs).toHaveLength(1);
    expect(refs[0]?.state).toBe("valid");

    // identidade estavel: encontra o item valido independentemente do indice bruto
    const items = normalizePostMedia(media);
    expect(findMediaItem(items, "bio-media", `${UUID}/good.jpg`)).toEqual({
      type: "image",
      bucket: "bio-media",
      path: `${UUID}/good.jpg`,
    });
    expect(findMediaItem(items, "bio-media", `${UUID}/missing.jpg`)).toBeNull();
  });
});

describe("G1 media contract purity", () => {
  test("contract/path modules do not import client, service role, demo or UI", async () => {
    for (const file of ["src/lib/media/media-contract.ts", "src/lib/media/media-path.ts"]) {
      const text = await readFile(join(projectRoot, file), "utf8");
      expect(text.includes("@/lib/supabase/client")).toBe(false);
      expect(text.includes("service_role")).toBe(false);
      expect(text.includes("createClient")).toBe(false);
      expect(text.includes("@/lib/demo/")).toBe(false);
      expect(text.includes("console.")).toBe(false);
    }
  });
});
