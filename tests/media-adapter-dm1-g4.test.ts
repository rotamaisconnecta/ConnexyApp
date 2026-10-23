import { describe, expect, test } from "bun:test";
import { toDomainPost, toRemotePostInsert } from "../src/lib/adapters/schema-a/content";
import type { DemoPost, DemoPostMedia } from "../src/lib/demo/demo-posts";
import type { PostRow } from "../src/integrations/supabase/remote/types";

/**
 * G4 / D-M1 — contrato de `posts.media`.
 *
 * Identidade primaria = `(bucket, path)`. Itens canonicos SEM preview NAO podem
 * ser descartados. Legado (URL/data URL) e locais (`mediaId`) permanecem
 * compativeis. Apenas itens sem identidade alguma ou com tipo invalido sao
 * descartados.
 */

const A = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const CONV = "cccccccc-cccc-4ccc-accc-cccccccccccc";
const NOW = "2026-09-25T03:00:00.000Z";
const IMG_PATH = `${A}/posts/11111111-1111-4111-8111-111111111111.jpg`;
const VID_PATH = `${A}/posts/22222222-2222-4222-8222-222222222222.mp4`;
const POSTER_PATH = `${A}/posts/33333333-3333-4333-8333-333333333333.jpg`;

function draft(media: DemoPostMedia[]): DemoPost {
  return {
    id: "local-post",
    authorId: A,
    authorName: "Ana",
    authorPhoto: "",
    authorHandle: "ana",
    text: "hello",
    media,
    category: "TEXT",
    privacy: "PUBLIC",
    locationLabel: null,
    hashtags: [],
    createdAt: Date.parse(NOW),
  };
}

function roundTrip(media: DemoPostMedia[]): DemoPostMedia[] {
  const insert = toRemotePostInsert(draft(media), A);
  const row = { id: CONV, ...insert } as unknown as PostRow;
  return toDomainPost(row, {
    authorName: "Ana",
    authorPhoto: "",
    authorHandle: "ana",
  }).media;
}

describe("G4 D-M1 — posts.media round-trip", () => {
  test("canonical item without preview is preserved, not silently dropped", () => {
    const media: DemoPostMedia[] = [{ type: "image", bucket: "bio-media", path: IMG_PATH }];
    expect(roundTrip(media)).toEqual(media);
  });

  test("video canonical item keeps posterPath", () => {
    const media: DemoPostMedia[] = [
      { type: "video", bucket: "reels-media", path: VID_PATH, posterPath: POSTER_PATH },
    ];
    expect(roundTrip(media)).toEqual(media);
  });

  test("canonical identity coexists with local preview and mediaId", () => {
    const media: DemoPostMedia[] = [
      {
        type: "image",
        bucket: "bio-media",
        path: IMG_PATH,
        preview: "data:image/png;base64,xx",
        mediaId: "local-1",
      },
    ];
    expect(roundTrip(media)).toEqual(media);
  });

  test("legacy data URL (local) stays compatible", () => {
    const media: DemoPostMedia[] = [{ preview: "data:image/png;base64,xx", type: "image" }];
    expect(roundTrip(media)).toEqual(media);
  });

  test("legacy external Storage-agnostic URL stays compatible", () => {
    const media: DemoPostMedia[] = [{ preview: "https://cdn.example.com/old.jpg", type: "image" }];
    expect(roundTrip(media)).toEqual(media);
  });

  test("item without any identity is dropped (no invented path)", () => {
    const media: DemoPostMedia[] = [{ type: "image" }];
    expect(roundTrip(media)).toEqual([]);
  });

  test("invalid type is dropped", () => {
    const media = [
      { type: "audio", preview: "data:audio/mp3;base64,xx" },
    ] as unknown as DemoPostMedia[];
    expect(roundTrip(media)).toEqual([]);
  });

  test("invalid bucket drops canonical identity but keeps the safe preview", () => {
    const media: DemoPostMedia[] = [
      {
        type: "image",
        bucket: "not-a-bucket",
        path: IMG_PATH,
        preview: "data:image/png;base64,xx",
      },
    ];
    expect(roundTrip(media)).toEqual([{ type: "image", preview: "data:image/png;base64,xx" }]);
  });

  test("mixed items preserve order and each category", () => {
    const media: DemoPostMedia[] = [
      { type: "image", bucket: "bio-media", path: IMG_PATH },
      { preview: "data:image/png;base64,yy", type: "image", mediaId: "local-2" },
      { type: "video", bucket: "reels-media", path: VID_PATH, posterPath: POSTER_PATH },
      { preview: "https://cdn.example.com/z.jpg", type: "image" },
    ];
    expect(roundTrip(media)).toEqual(media);
  });

  test("serialized jsonb only contains identity fields actually present", () => {
    const insert = toRemotePostInsert(
      draft([{ type: "image", bucket: "bio-media", path: IMG_PATH }]),
      A,
    );
    const first = (insert.media as Record<string, unknown>[])[0];
    expect(first).toEqual({ type: "image", bucket: "bio-media", path: IMG_PATH });
    expect("preview" in first).toBe(false);
  });
});
