import { BrandCard } from "@/components/ui/brand-card";
import { BrandAvatar } from "@/components/ui/brand-avatar";

interface PublisherPreviewProps {
  text: string;
  authorName?: string;
  authorHandle?: string;
  authorPhoto?: string;
  location?: string;
  hashtags?: string[];
}

export function PublisherPreview({
  text,
  authorName = "Você",
  authorHandle = "@voce",
  authorPhoto,
  location,
  hashtags = [],
}: PublisherPreviewProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Pré-visualização
      </p>
      <BrandCard shadow="soft" padding={false} className="overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <BrandAvatar src={authorPhoto} alt={authorName} size="sm" />
            <div>
              <p className="text-sm font-bold">{authorName}</p>
              <p className="text-xs text-muted-foreground">{authorHandle}</p>
            </div>
          </div>
          {text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>}
          {location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">📍 {location}</p>
          )}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag) => (
                <span key={tag} className="text-xs text-primary font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </BrandCard>
    </div>
  );
}
