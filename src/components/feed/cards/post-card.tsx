import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { PresenceDot } from "@/components/presence-dot";
import { formatRelativeTime, formatNumber } from "@/lib/feed/feed-utils";
import type { FeedItem, PostData } from "@/lib/feed/feed-types";

interface PostCardProps {
  item: FeedItem;
}

export function PostCard({ item }: PostCardProps) {
  const d = item.data as PostData;

  return (
    <article className="rounded-3xl border border-border bg-surface shadow-soft overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-0">
        <div className="relative">
          <img
            src={item.author.photo}
            alt={`Foto de ${item.author.name}`}
            className="h-10 w-10 rounded-full object-cover"
          />
          {item.author.online !== undefined && (
            <span className="absolute -bottom-0.5 -right-0.5">
              <PresenceDot online={item.author.online} size={10} />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{item.author.name}</div>
          <div className="text-[11px] text-muted-foreground">
            {formatRelativeTime(item.createdAt)}
          </div>
        </div>
      </div>

      {/* Text */}
      {d.text && <p className="px-4 pt-3 text-sm text-foreground leading-relaxed">{d.text}</p>}

      {/* Photos */}
      {d.photos.length > 0 && (
        <div className="mt-3">
          {d.photos.length === 1 ? (
            <img
              src={d.photos[0]}
              alt="Foto da publicação"
              className="w-full max-h-64 object-cover"
            />
          ) : (
            <div className="grid grid-cols-2 gap-0.5">
              {d.photos.slice(0, 4).map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt="Foto da publicação"
                  className="aspect-square object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-3">
        <ActionButton icon={Heart} label="Curtir" count={d.likes} />
        <ActionButton icon={MessageCircle} label="Comentar" count={d.comments} />
        <ActionButton icon={Share2} label="Compartilhar" count={d.shares} />
        <div className="flex-1" />
        <ActionButton icon={Bookmark} label="Salvar" />
      </div>
    </article>
  );
}

function ActionButton({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
      {count !== undefined && <span>{formatNumber(count)}</span>}
    </button>
  );
}
