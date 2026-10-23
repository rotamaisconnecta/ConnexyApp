import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

async function read(relativePath: string): Promise<string> {
  return readFile(join(ROOT, relativePath), "utf8");
}

describe("G4.24 profile avatar consumers", () => {
  test("profile, discovery, chat, presence, feed and reel avatar views use the shared resolver", async () => {
    const files = [
      "src/routes/_app.home.tsx",
      "src/routes/_app.perfil.index.tsx",
      "src/routes/_app.perfil.$id.tsx",
      "src/routes/_app.pessoas.tsx",
      "src/routes/_app.connecta.tsx",
      "src/routes/_app.solicitacao.$id.tsx",
      "src/routes/_app/discover.tsx",
      "src/components/discover/nearby-map-item-card.tsx",
      "src/components/discovery/people-list-card.tsx",
      "src/components/discovery/people-list.tsx",
      "src/components/discovery/person-card.tsx",
      "src/components/chat/chat-header.tsx",
      "src/components/chat/thread-avatar.tsx",
      "src/components/chat/conversation-card.tsx",
      "src/components/chat/conversations-screen.tsx",
      "src/components/chat/group-invite-sheet.tsx",
      "src/components/reels/reel-card.tsx",
      "src/components/reels/reel-user.tsx",
      "src/components/reels/comments-sheet.tsx",
      "src/components/presence/presence-live-feed-real.tsx",
      "src/components/feed/FeedNearbyPeople.tsx",
      "src/components/feed/cards/networking-card.tsx",
      "src/components/feed/cards/post-card.tsx",
      "src/components/feed/cards/moment-card.tsx",
      "src/components/bio/bio-avatar.tsx",
    ];
    const sources = await Promise.all(files.map(read));
    for (const source of sources) expect(source).toContain("AuthenticatedAvatarImage");
  });

  test("the shared image clears on auth identity changes and ignores obsolete responses", async () => {
    const source = await read("src/components/media/authenticated-avatar-image.tsx");
    expect(source).toContain("getAvatarMediaUrl({ data: { profileId } })");
    expect(source).toContain("user?.id");
    expect(source).toContain("setResolvedUrl(null)");
    expect(source).toContain("if (!obsolete)");
    expect(source).toContain("obsolete = true");
    expect(source).not.toContain("createMediaResolver");
  });

  test("resolution failure and missing avatars use local fallbacks, not public URL fallbacks", async () => {
    const source = await read("src/components/media/authenticated-avatar-image.tsx");
    expect(source).toContain('result.status === "ready" ? result.url : null');
    expect(source).toContain("return <>{fallback}</>");
    expect(source).not.toContain("getPublicUrl");
    expect(source).not.toContain("/object/public/");
  });

  test("G4.26D a canonical legacyUrl is never rendered directly for a UUID profile (C-05)", async () => {
    const source = await read("src/components/media/authenticated-avatar-image.tsx");
    // UUID profile + non-local legacyUrl => resolve server-side, not trust the value.
    expect(source).toContain("const shouldResolve = UUID_RE.test(profileId) && !isLocalPreview;");
    // src selection must prefer the resolved URL over a non-local legacyUrl.
    expect(source).toContain(
      "const src = isLocalPreview ? legacyUrl : shouldResolve ? resolvedUrl : legacyUrl;",
    );
  });

  test("reel and post media contracts remain unchanged while their author avatars resolve securely", async () => {
    const reel = await read("src/components/reels/reel-card.tsx");
    const post = await read("src/components/feed/cards/post-card.tsx");
    expect(reel).toContain("src={reel.video_url}");
    expect(reel).toContain("poster={reel.poster_url ?? undefined}");
    expect(reel).toContain("profileId={reel.author.id}");
    expect(post).toContain("src={d.photos[0]}");
    expect(post).toContain("profileId={item.author.id}");
  });
});
