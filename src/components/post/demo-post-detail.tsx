import { useMemo, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, MapPin, Send } from "lucide-react";
import { TypeScale } from "@/theme/typography";
import { formatRelativeTime } from "@/lib/feed/feed-utils";
import {
  POST_CATEGORY_META,
  POST_PRIVACY_META,
  type PostCategoryValue,
  type PostPrivacyValue,
} from "@/lib/types/post";
import type { DemoPost } from "@/lib/demo/demo-posts";
import {
  addDemoPostComment,
  listDemoPostComments,
  subscribeDemoPostComments,
} from "@/lib/demo/demo-post-comments";
import { LocalMediaFrame } from "@/components/media/local-media-frame";

function isPostCategory(value: string | null): value is PostCategoryValue {
  return Boolean(value && value in POST_CATEGORY_META);
}

function isPostPrivacy(value: string): value is PostPrivacyValue {
  return value in POST_PRIVACY_META;
}

export function DemoPostDetail({ post, onClose }: { post: DemoPost; onClose: () => void }) {
  const categoryMeta = isPostCategory(post.category) ? POST_CATEGORY_META[post.category] : null;
  const privacyMeta = isPostPrivacy(post.privacy) ? POST_PRIVACY_META[post.privacy] : null;
  const createdLabel = formatRelativeTime(new Date(post.createdAt));
  const [comments, setComments] = useState(() => listDemoPostComments(post.id));
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const refresh = () => setComments(listDemoPostComments(post.id));
    refresh();
    return subscribeDemoPostComments(refresh);
  }, [post.id]);
  const commentCount = comments.length;

  const sorted = useMemo(
    () => [...comments].sort((a, b) => a.createdAt - b.createdAt),
    [comments],
  );

  function handleComment() {
    const created = addDemoPostComment(post.id, draft);
    if (created) setDraft("");
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex flex-col bg-background"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-height, 4.75rem))",
      }}
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Voltar ao perfil"
          className="grid h-10 w-10 place-items-center rounded-full transition active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2
          className={`min-w-0 flex-1 truncate font-display font-semibold ${TypeScale.subsectionTitle}`}
        >
          Publicação
        </h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 px-4 py-3">
          <img
            src={post.authorPhoto}
            alt={`Foto de ${post.authorName}`}
            className="h-11 w-11 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className={`truncate font-semibold ${TypeScale.cardTitle}`}>{post.authorName}</p>
            <p className={`mt-0.5 text-muted-foreground ${TypeScale.meta}`}>
              @{post.authorHandle}
              <span aria-hidden> · </span>
              {createdLabel}
              {privacyMeta ? (
                <>
                  <span aria-hidden> · </span>
                  {privacyMeta.label}
                </>
              ) : null}
            </p>
          </div>
          {categoryMeta ? (
            <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-[13px] font-medium text-primary">
              {categoryMeta.emoji} {categoryMeta.label}
            </span>
          ) : null}
        </div>

        {post.media.map((media, index) => (
          <LocalMediaFrame
            key={`${media.mediaId ?? media.preview}-${index}`}
            mediaId={media.mediaId}
            fallbackUrl={media.preview}
          >
            {(url) =>
              media.type === "video" ? (
                <video
                  src={url ?? undefined}
                  controls
                  playsInline
                  className="max-h-[70vh] w-full bg-black object-contain"
                />
              ) : (
                <img
                  src={url ?? undefined}
                  alt={post.text || `Mídia ${index + 1} da publicação`}
                  className="max-h-[70vh] w-full bg-black object-contain"
                />
              )
            }
          </LocalMediaFrame>
        ))}

        <div className="space-y-3 px-4 py-4">
          {post.text ? (
            <p className={`whitespace-pre-wrap text-foreground ${TypeScale.body}`}>{post.text}</p>
          ) : null}

          {post.hashtags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {post.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent px-2 py-0.5 text-[13px] font-medium text-primary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          {post.interests && post.interests.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {post.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-secondary px-2 py-0.5 text-[13px] font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : null}

          {post.locationLabel ? (
            <p className={`flex items-center gap-1.5 text-muted-foreground ${TypeScale.caption}`}>
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {post.locationLabel}
            </p>
          ) : null}

          {post.mentions && post.mentions.length > 0 ? (
            <div>
              <p className={`font-medium text-muted-foreground ${TypeScale.meta}`}>
                Pessoas marcadas
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {post.mentions.map((mention) => (
                  <Link
                    key={mention.id}
                    to="/perfil/$id"
                    params={{ id: mention.id }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-1"
                  >
                    {mention.photo ? (
                      <img
                        src={mention.photo}
                        alt=""
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : null}
                    <span className={`font-medium text-primary ${TypeScale.caption}`}>
                      {mention.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {privacyMeta ? (
            <p className={`flex items-center gap-1.5 text-muted-foreground ${TypeScale.caption}`}>
              <Lock className="h-3.5 w-3.5 shrink-0" />
              {privacyMeta.description}
            </p>
          ) : null}

          <section className="border-t border-border/70 pt-4">
            <h3 className={`font-semibold ${TypeScale.cardTitle}`}>
              Comentários{commentCount ? ` · ${commentCount}` : ""}
            </h3>
            {sorted.length === 0 ? (
              <p className={`mt-2 text-muted-foreground ${TypeScale.caption}`}>
                Seja o primeiro a comentar.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {sorted.map((comment) => (
                  <li key={comment.id} className="flex gap-2.5">
                    <img
                      src={comment.authorPhoto}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold ${TypeScale.caption}`}>{comment.authorName}</p>
                      <p className={`whitespace-pre-wrap ${TypeScale.body}`}>{comment.text}</p>
                      <p className={`mt-0.5 text-muted-foreground ${TypeScale.meta}`}>
                        {formatRelativeTime(new Date(comment.createdAt))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <form
        className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          handleComment();
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escreva um comentário…"
          className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Comentário"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
          aria-label="Publicar comentário"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
