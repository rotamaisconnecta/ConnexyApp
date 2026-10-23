import { UserPlus } from "lucide-react";
import { PresenceDot } from "@/components/presence-dot";
import type { FeedItem, NetworkingData } from "@/lib/feed/feed-types";
import { AuthenticatedAvatarImage } from "@/components/media/authenticated-avatar-image";

interface NetworkingCardProps {
  item: FeedItem;
}

export function NetworkingCard({ item }: NetworkingCardProps) {
  const d = item.data as NetworkingData;

  return (
    <article className="rounded-2xl border border-border bg-surface shadow-soft p-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <AuthenticatedAvatarImage
            profileId={d.person.id}
            legacyUrl={d.person.photo}
            alt={`Foto de ${d.person.name}`}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
            fallback={
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-white ring-2 ring-border">
                {d.person.name.slice(0, 2).toUpperCase()}
              </div>
            }
          />
          <span className="absolute -bottom-0.5 -right-0.5">
            <PresenceDot online={d.person.online ?? false} size={10} />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm font-bold">{d.person.name}</h3>
          <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-primary">
            {d.compatibility}% compatível
          </div>
        </div>
      </div>

      {d.sharedInterests.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {d.sharedInterests.map((interest) => (
            <span
              key={interest}
              className="rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5"
            >
              {interest}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        className="mt-2 w-full h-8 rounded-xl bg-gradient-brand text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-soft transition-all hover:brightness-110 active:scale-[0.98]"
      >
        <UserPlus className="h-3 w-3" />
        Conectar
      </button>
    </article>
  );
}
