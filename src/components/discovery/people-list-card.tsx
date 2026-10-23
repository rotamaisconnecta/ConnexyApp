import { cn } from "@/lib/utils";
import { PresenceDot } from "@/components/presence-dot";
import { DistanceBadge } from "./distance-badge";
import { MutualInterests } from "./mutual-interests";
import { ConnectButton } from "./connect-button";
import { TypeScale } from "@/theme/typography";
import type { NearbyMapItemVisual } from "../discover/nearby-map-item-card";
import { getDiscoverItemNavigation } from "@/lib/discovery/discover-navigation";
import { useNavigate } from "@tanstack/react-router";
import { AuthenticatedAvatarImage } from "@/components/media/authenticated-avatar-image";

interface PeopleListCardProps {
  item: NearbyMapItemVisual & {
    age?: number;
    online?: boolean;
    verified?: boolean;
    location?: string;
    profession?: string;
    headline?: string;
    interests?: string[];
    compatibilityPercent?: number;
    interestPercent?: number;
  };
  onConnect?: (id: string) => void;
  connected?: boolean;
}

export function PeopleListCard({ item, onConnect, connected = false }: PeopleListCardProps) {
  const navigate = useNavigate();
  const nav = getDiscoverItemNavigation(item as any);
  const targetId = (item as any).targetId ?? item.id;

  const handleBioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nav) navigate(nav);
  };

  const handleConnect = () => {
    if (onConnect) onConnect(targetId);
    else if (nav) navigate(nav);
  };

  const interests = item.interests ?? [];

  return (
    <div
      className="w-full rounded-3xl border border-border bg-surface shadow-soft overflow-hidden"
      aria-label={`Perfil de ${item.name}`}
    >
      <div className="flex gap-3 p-3">
        {/* Photo (large left) */}
        <div className="relative shrink-0">
          <div className="h-[120px] w-[120px] sm:h-[144px] sm:w-[144px] overflow-hidden rounded-2xl">
            <AuthenticatedAvatarImage
              profileId={item.id}
              legacyUrl={item.photo ?? null}
              alt={`Foto de ${item.name}`}
              className="h-full w-full object-cover"
              fallback={
                <div
                  className={cn(
                    "flex h-full w-full items-center justify-center text-3xl",
                    item.color,
                  )}
                >
                  <span aria-hidden>{item.icon}</span>
                </div>
              }
            />
          </div>

          {/* Online over photo */}
          <span className="absolute top-2 left-2 rounded-full bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
            <PresenceDot online={!!(item as any).online} size={8} />
            {(item as any).online && (
              <span className="ml-1 text-[9px] font-semibold text-white">Online</span>
            )}
          </span>

          {/* Distance/proximity over photo */}
          <div className="absolute bottom-2 left-2">
            <DistanceBadge meters={(item as any).distanceMeters ?? 0} />
          </div>
        </div>

        {/* Content right */}
        <div className="min-w-0 flex-1 flex flex-col justify-between gap-2">
          <div className="space-y-1.5">
            {/* Name + age + verified */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className={`truncate font-display font-bold ${TypeScale.cardTitle}`}>
                  {item.name}
                  {(item as any).age != null ? `, ${(item as any).age}` : ""}
                  {(item as any).verified && (
                    <span className="ml-1 align-middle text-primary" aria-label="Verificado">
                      ✓
                    </span>
                  )}
                </h3>
                {(item as any).location && (
                  <p className={`truncate text-muted-foreground ${TypeScale.meta}`}>
                    {(item as any).location}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleBioClick}
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
              >
                Ver bio &gt;
              </button>
            </div>

            {/* Headline */}
            {item.description && (
              <p className={`line-clamp-2 leading-snug text-muted-foreground ${TypeScale.caption}`}>
                {item.description}
              </p>
            )}
            {!item.description && (item as any).headline && (
              <p className={`line-clamp-2 leading-snug text-muted-foreground ${TypeScale.caption}`}>
                {(item as any).headline}
              </p>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <div className="pt-0.5">
                <MutualInterests interests={interests} maxShow={3} />
              </div>
            )}

            {/* Compatibility if available */}
            {(item as any).compatibilityPercent != null && (
              <div className={`text-xs font-semibold text-primary ${TypeScale.meta}`}>
                Compatibilidade {(item as any).compatibilityPercent}%
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end">
            <div className="w-full max-w-[160px] sm:max-w-[180px]">
              <ConnectButton onClick={handleConnect} connected={connected} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
