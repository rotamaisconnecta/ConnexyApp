import { type PostDraft, POST_CATEGORY_META, POST_PRIVACY_META } from "@/lib/types/post";
import { MapPin, Lock, Globe, Users, Heart } from "lucide-react";
import { type PostPrivacyValue, PostPrivacy } from "@/lib/types/post";

interface PostPreviewProps {
  draft: PostDraft;
  authorName: string;
  authorPhoto: string;
  authorHandle: string;
}

const PRIVACY_ICONS: Record<PostPrivacyValue, typeof Globe> = {
  [PostPrivacy.PUBLIC]: Globe,
  [PostPrivacy.CONNECTIONS]: Users,
  [PostPrivacy.FRIENDS]: Heart,
  [PostPrivacy.PRIVATE]: Lock,
};

export function PostPreview({ draft, authorName, authorPhoto, authorHandle }: PostPreviewProps) {
  const PrivacyIcon = PRIVACY_ICONS[draft.privacy];
  const categoryMeta = draft.category ? POST_CATEGORY_META[draft.category] : null;
  const privacyMeta = POST_PRIVACY_META[draft.privacy];

  return (
    <div className="rounded-3xl border border-border bg-surface overflow-hidden shadow-soft">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-0">
        <img
          src={authorPhoto}
          alt={`Foto de ${authorName}`}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{authorName}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>@{authorHandle}</span>
            <span>·</span>
            <PrivacyIcon className="h-3 w-3" />
            <span>{privacyMeta.label}</span>
          </div>
        </div>
        {categoryMeta && (
          <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-primary">
            {categoryMeta.emoji} {categoryMeta.label}
          </span>
        )}
      </div>

      {/* Media */}
      {draft.media.length > 0 && (
        <div className="mt-3">
          {draft.media.length === 1 ? (
            <img
              src={draft.media[0].preview}
              alt="Preview da publicação"
              className="w-full max-h-64 object-cover"
            />
          ) : (
            <div className="grid grid-cols-2 gap-0.5">
              {draft.media.slice(0, 4).map((m) => (
                <img
                  key={m.id}
                  src={m.preview}
                  alt="Preview da publicação"
                  className="aspect-square object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Text */}
      {draft.text && (
        <div className="px-4 py-3">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {draft.text}
          </p>
        </div>
      )}

      {/* Tags */}
      {(draft.hashtags.length > 0 || draft.interests.length > 0) && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {draft.hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-primary"
            >
              #{tag}
            </span>
          ))}
          {draft.interests.map((i) => (
            <span
              key={i.id}
              className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-foreground"
            >
              {i.label}
            </span>
          ))}
        </div>
      )}

      {/* Location */}
      {draft.location && (
        <div className="px-4 pb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {draft.location.name}
        </div>
      )}

      {/* Mentions */}
      {draft.mentions.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {draft.mentions.map((m) => (
            <span key={m.id} className="text-[11px] font-semibold text-primary">
              @{m.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
