import { afterEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { RemoteErrorCode, RemoteRepositoryError } from "../src/integrations/supabase/remote/errors";
import type { PostRow } from "../src/integrations/supabase/remote/types";
import type { AdaptedPostAuthor } from "../src/lib/adapters/schema-a/content";
import { AdapterMappingError } from "../src/lib/adapters/schema-a/errors";
import { setRemoteAuthGateForTests } from "../src/lib/auth/schema-a-auth-flag";
import {
  SchemaAContentError,
  SchemaAContentErrorCode,
  createSchemaAContent,
  type SchemaAContentPort,
} from "../src/lib/content/schema-a-content";
import {
  isRemoteContentEnabled,
  isSchemaAContentFlagEnabled,
  setRemoteContentGateForTests,
} from "../src/lib/content/schema-a-content-flag";
import type { DemoPost } from "../src/lib/demo/demo-posts";
import { getDemoIdentity } from "../src/lib/demo/demo-identity";

const projectRoot = join(import.meta.dir, "..");
const A = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const NOW = "2026-09-25T00:00:00.000Z";

const AUTHOR: AdaptedPostAuthor = {
  authorName: "Ana",
  authorPhoto: "photo",
  authorHandle: "ana",
};

afterEach(() => {
  setRemoteAuthGateForTests(null);
  setRemoteContentGateForTests(null);
});

function demoPost(overrides: Partial<DemoPost> = {}): DemoPost {
  return {
    id: "demo-post-1",
    authorId: "lucas",
    authorName: "Ana",
    authorPhoto: "photo",
    authorHandle: "ana",
    text: "ola",
    media: [],
    category: "TEXT",
    privacy: "PUBLIC",
    locationLabel: null,
    hashtags: [],
    createdAt: 1000,
    ...overrides,
  };
}

function memoryPort(uid: string): {
  port: SchemaAContentPort;
  calls: string[];
  rows: PostRow[];
} {
  const calls: string[] = [];
  const rows: PostRow[] = [];
  let seq = 0;
  const port: SchemaAContentPort = {
    async createPost(input) {
      calls.push(`createPost:${input.privacy}`);
      const row: PostRow = {
        id: `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`,
        author_id: uid,
        text: input.text ?? null,
        category: input.category ?? null,
        privacy: input.privacy,
        location_label: input.location_label ?? null,
        hashtags: input.hashtags ?? [],
        media: input.media ?? [],
        created_at: NOW,
      };
      rows.push(row);
      return row;
    },
    async updatePost(id, patch) {
      calls.push(`updatePost:${id}`);
      const row = rows.find((item) => item.id === id);
      if (!row) throw new RemoteRepositoryError("Post was not found", RemoteErrorCode.NOT_FOUND);
      if (patch.text !== undefined) row.text = patch.text ?? null;
      if (patch.category !== undefined) row.category = patch.category ?? null;
      if (patch.privacy !== undefined) row.privacy = patch.privacy;
      if (patch.location_label !== undefined) row.location_label = patch.location_label ?? null;
      if (patch.hashtags !== undefined) row.hashtags = patch.hashtags;
      if (patch.media !== undefined) row.media = patch.media;
      return row;
    },
    async deletePost(id) {
      calls.push(`deletePost:${id}`);
      const index = rows.findIndex((item) => item.id === id);
      if (index < 0)
        throw new RemoteRepositoryError("Post was not deleted", RemoteErrorCode.NOT_FOUND);
      rows.splice(index, 1);
    },
    async getPost(id) {
      calls.push(`getPost:${id}`);
      return rows.find((item) => item.id === id) ?? null;
    },
    async listOwnPosts() {
      calls.push("listOwnPosts");
      return rows.filter((item) => item.author_id === uid);
    },
  };
  return { port, calls, rows };
}

function contentFor(uid: string, enabled = true) {
  const { port, calls, rows } = memoryPort(uid);
  return {
    calls,
    rows,
    content: createSchemaAContent({
      isEnabled: () => enabled,
      getIdentity: async () => ({ userId: uid }),
      getAuthor: async () => AUTHOR,
      content: port,
    }),
  };
}

describe("1H-21 Content flag", () => {
  test("Demo keeps Content cutover off even if both flags are on", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => true,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setRemoteContentGateForTests({ isFlagEnabled: () => true });
    expect(isRemoteContentEnabled()).toBe(false);
    expect(typeof isSchemaAContentFlagEnabled()).toBe("boolean");
  });

  test("Auth on without Content flag keeps Demo Content", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setRemoteContentGateForTests({ isFlagEnabled: () => false });
    expect(isRemoteContentEnabled()).toBe(false);
  });

  test("Auth + Content flags enable remote Content", () => {
    setRemoteAuthGateForTests({
      isDemoMode: () => false,
      isFlagEnabled: () => true,
      isPublicSupabaseConfigured: () => true,
    });
    setRemoteContentGateForTests({ isFlagEnabled: () => true });
    expect(isRemoteContentEnabled()).toBe(true);
  });
});

describe("1H-21 Remote Content", () => {
  test("remote identity is the Auth UUID, not getDemoIdentity()", async () => {
    const { content } = contentFor(A);
    const identity = await content.getIdentity();
    expect(identity).toEqual({ userId: A });
    expect(identity?.userId).not.toBe(getDemoIdentity().id);
    expect(identity?.userId).not.toBe("lucas");
  });

  test("publish uses the Auth author, not the demo authorId in the draft", async () => {
    const { content, rows } = contentFor(A);
    const published = await content.publishOwnPost(demoPost({ authorId: "lucas" }));
    expect(published.authorId).toBe(A);
    expect(published.id).not.toBe("demo-post-1");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.author_id).toBe(A);
  });

  test("FRIENDS collapses to CONNECTIONS on the remote post", async () => {
    const { content, rows } = contentFor(A);
    const published = await content.publishOwnPost(demoPost({ privacy: "FRIENDS" }));
    expect(published.privacy).toBe("CONNECTIONS");
    expect(rows[0]?.privacy).toBe("CONNECTIONS");
  });

  test("an unmapped privacy is rejected before any repository call", async () => {
    const { content, calls } = contentFor(A);
    try {
      await content.publishOwnPost(demoPost({ privacy: "SECRET" }));
      throw new Error("expected privacy failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AdapterMappingError);
    }
    expect(calls).toEqual([]);
  });

  test("edit maps privacy and rejects demo post ids", async () => {
    const { content } = contentFor(A);
    const published = await content.publishOwnPost(demoPost({ privacy: "PUBLIC" }));
    const edited = await content.editOwnPost(published.id, { text: "novo", privacy: "FRIENDS" });
    expect(edited.text).toBe("novo");
    expect(edited.privacy).toBe("CONNECTIONS");
    try {
      await content.editOwnPost("demo-post-1", { text: "x" });
      throw new Error("expected UUID failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AdapterMappingError);
    }
  });

  test("remove deletes an own post and rejects demo ids", async () => {
    const { content, rows } = contentFor(A);
    const published = await content.publishOwnPost(demoPost());
    await content.removeOwnPost(published.id);
    expect(rows).toEqual([]);
    try {
      await content.removeOwnPost("demo-post-1");
      throw new Error("expected UUID failure");
    } catch (error) {
      expect(error).toBeInstanceOf(AdapterMappingError);
    }
  });

  test("listOwnPosts adapts rows with the viewer author", async () => {
    const { content } = contentFor(A);
    await content.publishOwnPost(demoPost({ text: "um" }));
    await content.publishOwnPost(demoPost({ text: "dois" }));
    const posts = await content.listOwnPosts();
    expect(posts).toHaveLength(2);
    expect(posts.every((post) => post.authorId === A)).toBe(true);
    expect(posts.every((post) => post.authorName === "Ana")).toBe(true);
  });

  test("post visibility is limited to what the repository returns", async () => {
    const { content } = contentFor(A);
    const published = await content.publishOwnPost(demoPost());
    expect(await content.peekPost(published.id)).not.toBeNull();
    expect(await content.peekPost(B)).toBeNull();
  });

  test("disabled Content makes zero repository calls", async () => {
    const { content, calls } = contentFor(A, false);
    expect(content.isEnabled()).toBe(false);
    expect(await content.getIdentity()).toBeNull();
    try {
      await content.publishOwnPost(demoPost());
      throw new Error("expected disabled");
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaAContentError);
      expect((error as SchemaAContentError).code).toBe(SchemaAContentErrorCode.DISABLED);
    }
    expect(calls).toEqual([]);
  });
});

describe("1H-21 isolation and legacy guards", () => {
  test("remote Content module does not call getDemoIdentity( or touch conversations", async () => {
    const text = await readFile(join(projectRoot, "src/lib/content/schema-a-content.ts"), "utf8");
    expect(text.includes("getDemoIdentity(")).toBe(false);
    expect(text.includes("service_role")).toBe(false);
    expect(text.includes("demo-db")).toBe(false);
    expect(text.includes("RemoteConversationRepository")).toBe(false);
    expect(text.includes("ensureLocalConversation")).toBe(false);
  });

  test("Content port has no likes path; likes table is absent from Schema A", async () => {
    const moduleText = await readFile(
      join(projectRoot, "src/lib/content/schema-a-content.ts"),
      "utf8",
    );
    const flagText = await readFile(
      join(projectRoot, "src/lib/content/schema-a-content-flag.ts"),
      "utf8",
    );
    for (const text of [moduleText, flagText]) {
      expect(text.includes("likes")).toBe(false);
      expect(text.includes("bio_posts")).toBe(false);
    }
    const { content } = contentFor(A);
    expect("like" in content).toBe(false);
    expect("likePost" in content).toBe(false);
  });

  test("legacy FeedRepository still targets the pre-Schema-A likes table (documented gap)", async () => {
    const feed = await readFile(join(projectRoot, "src/repositories/feed.repository.ts"), "utf8");
    expect(feed.includes('.from("bio_posts")')).toBe(true);
    expect(feed.includes('.from("likes")')).toBe(true);
    const tables = await readFile(
      join(projectRoot, "src/integrations/supabase/remote/types.ts"),
      "utf8",
    );
    expect(tables.includes('["likes"]')).toBe(false);
  });
});
