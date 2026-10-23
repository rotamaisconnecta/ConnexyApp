import {
  toDomainPost,
  toRemotePostInsert,
  toRemotePostPrivacy,
  type AdaptedPost,
  type AdaptedPostAuthor,
} from "@/lib/adapters/schema-a/content";
import { requireSchemaAUuid } from "@/lib/adapters/schema-a/ids";
import { toSchemaAAuthIdentity, type SchemaAAuthIdentity } from "@/lib/adapters/schema-a/identity";
import type { DemoPost } from "@/lib/demo/demo-posts";
import type { SchemaAJson as Json } from "@/integrations/supabase/schema-a-database";
import type { PostPrivacy, PostRow } from "@/integrations/supabase/remote/types";
import { isRemoteContentEnabled } from "./schema-a-content-flag";

export type RemoteContentIdentity = SchemaAAuthIdentity;

export const SchemaAContentErrorCode = {
  DISABLED: "DISABLED",
  NO_SESSION: "NO_SESSION",
  IDENTITY: "IDENTITY",
  AUTHOR: "AUTHOR",
} as const;

export type SchemaAContentErrorCodeValue =
  (typeof SchemaAContentErrorCode)[keyof typeof SchemaAContentErrorCode];

export class SchemaAContentError extends Error {
  readonly code: SchemaAContentErrorCodeValue;

  constructor(message: string, code: SchemaAContentErrorCodeValue) {
    super(message);
    this.name = "SchemaAContentError";
    this.code = code;
  }
}

export type SchemaAContentCreateInput = {
  text?: string | null;
  privacy: PostPrivacy;
  category?: string | null;
  location_label?: string | null;
  hashtags?: string[];
  media?: Json;
};

export type SchemaAContentPatch = {
  text?: string | null;
  privacy?: string;
  category?: string | null;
  locationLabel?: string | null;
  hashtags?: string[];
};

export type SchemaAContentPort = {
  createPost: (input: SchemaAContentCreateInput) => Promise<PostRow>;
  updatePost: (
    id: string,
    patch: {
      text?: string | null;
      privacy?: PostPrivacy;
      category?: string | null;
      location_label?: string | null;
      hashtags?: string[];
      media?: Json;
    },
  ) => Promise<PostRow>;
  deletePost: (id: string) => Promise<void>;
  getPost: (id: string) => Promise<PostRow | null>;
  listOwnPosts: () => Promise<PostRow[]>;
};

export type SchemaAContentDeps = {
  isEnabled: () => boolean;
  getIdentity: () => Promise<RemoteContentIdentity | null>;
  getAuthor: () => Promise<AdaptedPostAuthor | null>;
  content: SchemaAContentPort;
};

/**
 * Domain boundary for posts (`posts`). Remote only; media uploads and
 * signed-URL authorization live outside this port (see Lote F / ADR D2).
 */
export function createSchemaAContent(deps: SchemaAContentDeps) {
  async function requireIdentity(): Promise<RemoteContentIdentity> {
    if (!deps.isEnabled()) {
      throw new SchemaAContentError(
        "Schema A Content is disabled",
        SchemaAContentErrorCode.DISABLED,
      );
    }
    const identity = await deps.getIdentity();
    if (!identity) {
      throw new SchemaAContentError("No remote Auth session", SchemaAContentErrorCode.NO_SESSION);
    }
    return toSchemaAAuthIdentity(identity.userId);
  }

  async function requireAuthor(): Promise<AdaptedPostAuthor> {
    const author = await deps.getAuthor();
    if (!author) {
      throw new SchemaAContentError("No own profile author", SchemaAContentErrorCode.AUTHOR);
    }
    return author;
  }

  function requirePostId(value: string): string {
    return requireSchemaAUuid(value, "postId");
  }

  return {
    isEnabled(): boolean {
      return deps.isEnabled();
    },

    async getIdentity(): Promise<RemoteContentIdentity | null> {
      if (!deps.isEnabled()) return null;
      const identity = await deps.getIdentity();
      return identity ? toSchemaAAuthIdentity(identity.userId) : null;
    },

    async publishOwnPost(post: DemoPost): Promise<AdaptedPost> {
      const identity = await requireIdentity();
      const insert = toRemotePostInsert(post, identity.userId);
      const { privacy } = toRemotePostPrivacy(post.privacy);
      const row = await deps.content.createPost({
        text: insert.text,
        privacy,
        category: insert.category ?? null,
        location_label: insert.location_label ?? null,
        hashtags: insert.hashtags,
        media: insert.media,
      });
      return toDomainPost(row, await requireAuthor());
    },

    async editOwnPost(id: string, patch: SchemaAContentPatch): Promise<AdaptedPost> {
      await requireIdentity();
      const mapped: Parameters<SchemaAContentPort["updatePost"]>[1] = {};
      if (patch.text !== undefined) mapped.text = patch.text;
      if (patch.category !== undefined) mapped.category = patch.category;
      if (patch.locationLabel !== undefined) mapped.location_label = patch.locationLabel;
      if (patch.hashtags !== undefined) mapped.hashtags = patch.hashtags;
      if (patch.privacy !== undefined) mapped.privacy = toRemotePostPrivacy(patch.privacy).privacy;
      const row = await deps.content.updatePost(requirePostId(id), mapped);
      return toDomainPost(row, await requireAuthor());
    },

    async removeOwnPost(id: string): Promise<void> {
      await requireIdentity();
      await deps.content.deletePost(requirePostId(id));
    },

    async getOwnPost(id: string): Promise<AdaptedPost | null> {
      await requireIdentity();
      const row = await deps.content.getPost(requirePostId(id));
      return row ? toDomainPost(row, await requireAuthor()) : null;
    },

    async peekPost(id: string): Promise<AdaptedPost | null> {
      await requireIdentity();
      const row = await deps.content.getPost(requirePostId(id));
      return row ? toDomainPost(row, await requireAuthor()) : null;
    },

    async listOwnPosts(): Promise<AdaptedPost[]> {
      await requireIdentity();
      const rows = await deps.content.listOwnPosts();
      const author = await requireAuthor();
      return rows.map((row) => toDomainPost(row, author));
    },
  };
}

export type SchemaAContent = ReturnType<typeof createSchemaAContent>;

let cachedDefault: SchemaAContent | null = null;

async function productionContentPort(): Promise<SchemaAContentPort> {
  const url = import.meta.env.VITE_APP_SUPABASE_URL;
  const key = import.meta.env.VITE_APP_SUPABASE_PUBLISHABLE_KEY;
  const { getSchemaAAuth } = await import("@/lib/auth/schema-a-auth");
  const identity = await getSchemaAAuth().getIdentity();
  if (!identity) {
    throw new SchemaAContentError("No remote Auth session", SchemaAContentErrorCode.NO_SESSION);
  }
  const { supabase } = await import("@/lib/supabase/client");
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) {
    throw new SchemaAContentError("No remote Auth session", SchemaAContentErrorCode.NO_SESSION);
  }
  const { createSchemaAClient } = await import("@/integrations/supabase/remote/client");
  const { RemoteContentRepository } =
    await import("@/integrations/supabase/remote/content.repository");
  const client = createSchemaAClient(url, key, { accessToken: token });
  return new RemoteContentRepository(client);
}

function lazyContentPort(): SchemaAContentPort {
  let portPromise: Promise<SchemaAContentPort> | null = null;
  const port = () => (portPromise ??= productionContentPort());
  return {
    async createPost(input) {
      return (await port()).createPost(input);
    },
    async updatePost(id, patch) {
      return (await port()).updatePost(id, patch);
    },
    async deletePost(id) {
      return (await port()).deletePost(id);
    },
    async getPost(id) {
      return (await port()).getPost(id);
    },
    async listOwnPosts() {
      return (await port()).listOwnPosts();
    },
  };
}

export function getSchemaAContent(): SchemaAContent {
  if (cachedDefault) return cachedDefault;
  cachedDefault = createSchemaAContent({
    isEnabled: isRemoteContentEnabled,
    async getIdentity() {
      const { getSchemaAAuth } = await import("@/lib/auth/schema-a-auth");
      return getSchemaAAuth().getIdentity();
    },
    async getAuthor() {
      const { getSchemaAProfile } = await import("@/lib/profile/schema-a-profile");
      const profile = await getSchemaAProfile().loadOwn();
      return {
        authorName: profile.name,
        authorPhoto: profile.photo,
        authorHandle: profile.handle,
      };
    },
    content: lazyContentPort(),
  });
  return cachedDefault;
}

export function resetSchemaAContentSingletonForTests(): void {
  cachedDefault = null;
}
