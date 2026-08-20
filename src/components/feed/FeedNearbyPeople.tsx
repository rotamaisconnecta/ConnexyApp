import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PremiumCarousel } from "@/components/carousel/PremiumCarousel";
import { formatPersonDistance } from "@/lib/proximity";
import { ConversationInviteButton } from "@/components/chat/conversation-invite-button";
import type { NearbyPeopleSectionData } from "@/lib/feed/feed-types";
import type { NearbyProfile } from "@/types/phase-13b";

const PEOPLE_CARD_WIDTH = { mobile: 160, tablet: 168, desktop: 176 } as const;
const PEOPLE_CARD_HEIGHT = 252;
const MAX_AFFINITY_CHIPS = 3;

function profileToFeedPerson(profile: NearbyProfile): NearbyPeopleSectionData["people"][number] {
  const distanceMeters = profile.distance_km != null ? profile.distance_km * 1000 : 0;
  const labels = [
    ...profile.common_interests,
    ...profile.common_vibe_tags,
    ...profile.common_looks_for,
  ].slice(0, 5);
  return {
    id: profile.id,
    name: profile.name,
    photo: profile.photo_url ?? "",
    age: profile.age ?? undefined,
    compatibility: profile.compatibility_score ?? undefined,
    distance: formatPersonDistance(distanceMeters),
    distanceMeters,
    interests: profile.common_interests,
    online: false,
    commonalities: labels.length > 0 ? { labels, total: labels.length } : undefined,
  };
}

interface FeedNearbyPeopleProps {
  data?: NearbyPeopleSectionData;
  profiles?: NearbyProfile[];
}

export function FeedNearbyPeople({ data, profiles }: FeedNearbyPeopleProps) {
  const people = profiles ? profiles.map(profileToFeedPerson) : (data?.people ?? []);

  if (people.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-4 px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm" aria-hidden>
              👥
            </span>
            <h3 className="font-display text-base font-bold truncate">Pessoas Próximas</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Conheça pessoas que compartilham seus interesses
          </p>
        </div>
        <Link
          to="/pessoas"
          className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5 transition-all duration-200 hover:gap-1"
        >
          Ver tudo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <PremiumCarousel
        section="people"
        items={people}
        cardWidths={PEOPLE_CARD_WIDTH}
        cardHeight={PEOPLE_CARD_HEIGHT}
        renderCard={(person) => {
          const affinityLabels = person.commonalities?.labels ?? [];
          const visibleLabels = affinityLabels.slice(0, MAX_AFFINITY_CHIPS);
          const extraAffinities = person.commonalities
            ? Math.max(0, person.commonalities.total - visibleLabels.length)
            : 0;

          return (
            <article
              className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-border/50 bg-surface transition-all duration-300 hover:shadow-xl"
              style={
                person.online
                  ? {
                      border: "2px solid",
                      borderImage: "linear-gradient(135deg, #a855f7, #ec4899) 1",
                    }
                  : undefined
              }
            >
              <Link
                to="/perfil/$id"
                params={{ id: person.id }}
                aria-label={`Ver perfil de ${person.name}`}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="relative w-full shrink-0" style={{ height: 112 }}>
                  {person.photo ? (
                    <img
                      src={person.photo}
                      alt={person.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-800 shadow-soft">
                    {formatPersonDistance(person.distanceMeters)}
                  </span>
                  {person.compatibility != null && (
                    <span
                      aria-label={`Compatibilidade de ${person.compatibility}%`}
                      className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-pink-600 shadow-soft"
                    >
                      {person.compatibility}%
                    </span>
                  )}
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-1 px-3 pt-2 pb-2">
                  <div className="flex items-center gap-1">
                    <span className="font-display font-bold text-[13px] truncate">
                      {person.name}
                    </span>
                    {person.age != null && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {person.age} anos
                      </span>
                    )}
                  </div>
                  {visibleLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {visibleLabels.map((label) => (
                        <span
                          key={label}
                          className="max-w-full truncate rounded-full bg-secondary px-2 py-0.5 text-[10px] text-foreground"
                        >
                          {label}
                        </span>
                      ))}
                      {extraAffinities > 0 && (
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          +{extraAffinities}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-auto flex items-center gap-1">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${person.online ? "bg-green-500" : "bg-gray-300"}`}
                    />
                    <span
                      className={`text-[10px] font-medium ${person.online ? "text-green-600" : "text-gray-400"}`}
                    >
                      {person.online ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </Link>
              <div className="px-3 pb-2.5">
                <ConversationInviteButton
                  personId={person.id}
                  personName={person.name}
                  variant="compact"
                  className="h-8 w-full text-[11px]"
                />
              </div>
            </article>
          );
        }}
      />
    </motion.div>
  );
}
