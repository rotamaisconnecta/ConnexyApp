import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PremiumCarousel } from "@/components/carousel/PremiumCarousel";
import { formatPersonDistance } from "@/lib/proximity";
import { ConversationInviteButton } from "@/components/chat/conversation-invite-button";
import { TypeScale } from "@/theme/typography";
import type { NearbyPeopleSectionData } from "@/lib/feed/feed-types";
import type { NearbyProfile } from "@/types/phase-13b";

const PEOPLE_CARD_HEIGHT = 268;
const PEOPLE_CARD_WIDTH_CLASS = "w-[146px] min-w-[146px]";
const MAX_AFFINITY_CHIPS = 3;
const NEARBY_PEOPLE_LIMIT = 10;

const PROXIMITY_TIER_LABELS: Record<string, string> = {
  very_close: "Muito perto",
  around_here: "Por aqui",
  nearby: "Nas redondezas",
  distance: "Um pouco mais longe",
};

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
    distance: PROXIMITY_TIER_LABELS[profile.proximity_tier] ?? formatPersonDistance(distanceMeters),
    distanceMeters,
    interests: profile.common_interests,
    online: false,
    headline: profile.headline ?? undefined,
    commonalities: labels.length > 0 ? { labels, total: labels.length } : undefined,
  };
}

interface FeedNearbyPeopleProps {
  data?: NearbyPeopleSectionData;
  profiles?: NearbyProfile[];
}

export function FeedNearbyPeople({ data, profiles }: FeedNearbyPeopleProps) {
  const source = profiles ? profiles.map(profileToFeedPerson) : (data?.people ?? []);
  const people = source.slice(0, NEARBY_PEOPLE_LIMIT);

  if (people.length === 0) {
    return (
      <div className="px-5 py-6 text-center">
        <p className={`${TypeScale.caption} text-muted-foreground`}>
          Nenhuma pessoa nova nas proximidades agora.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm" aria-hidden>
              👥
            </span>
            <h3 className={`truncate font-display font-semibold ${TypeScale.subsectionTitle}`}>
              Pessoas Próximas
            </h3>
          </div>
          <p className={`mt-0.5 text-muted-foreground ${TypeScale.caption}`}>
            Conheça pessoas que compartilham seus interesses
          </p>
        </div>
        <Link
          to="/discover"
          search={{ filter: "people" }}
          className={`flex shrink-0 items-center gap-0.5 font-semibold text-primary transition-all duration-200 hover:gap-1 ${TypeScale.label}`}
        >
          Ver mais <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <PremiumCarousel
        section="people-compact"
        items={people}
        cardHeight={PEOPLE_CARD_HEIGHT}
        cardSize="min"
        itemClassName={PEOPLE_CARD_WIDTH_CLASS}
        scrollerClassName="gap-3 pl-5 pr-5"
        renderCard={(person) => {
          const affinityLabels = person.commonalities?.labels?.length
            ? person.commonalities.labels
            : person.interests;
          const visibleLabels = affinityLabels.slice(0, MAX_AFFINITY_CHIPS);
          const nameLine = person.age != null ? `${person.name}, ${person.age}` : person.name;

          return (
            <article className="relative flex min-h-[268px] flex-col rounded-2xl border border-border/50 bg-surface">
              <Link
                to="/perfil/$id"
                params={{ id: person.id }}
                aria-label={`Ver perfil de ${person.name}`}
                className="flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="relative h-[96px] w-full shrink-0 overflow-hidden rounded-t-2xl">
                  {person.photo ? (
                    <img
                      src={person.photo}
                      alt={person.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <span className="text-xl font-semibold text-primary">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 inline-flex max-w-[calc(100%-12px)] items-center gap-1 rounded-full bg-black/45 px-1.5 py-0.5">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${person.online ? "bg-green-400" : "bg-white/50"}`}
                    />
                    <span className="text-[10px] font-medium leading-none text-white">
                      {person.online ? "Online" : "Offline"}
                    </span>
                  </span>
                  {person.distance ? (
                    <span className="absolute right-1.5 top-1.5 max-w-[calc(100%-12px)] rounded-full bg-black/45 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
                      {person.distance}
                    </span>
                  ) : null}
                </div>

                <div className="flex min-h-0 flex-1 flex-col px-2.5 pt-1.5">
                  <p className="text-[14px] font-semibold leading-[1.25] tracking-tight">
                    {nameLine}
                  </p>
                  {person.headline ? (
                    <p className="mt-0.5 text-[12px] font-normal leading-[1.3] text-muted-foreground">
                      {person.headline}
                    </p>
                  ) : null}
                  {visibleLabels.length > 0 ? (
                    <p className="mt-0.5 text-[11px] font-normal leading-[1.35] text-muted-foreground/80">
                      Interesses: {visibleLabels.join(" · ")}
                    </p>
                  ) : null}
                  {person.compatibility != null ? (
                    <p className="mt-1 text-[12px] font-semibold leading-none text-primary">
                      Compatibilidade {person.compatibility}%
                    </p>
                  ) : null}
                </div>
              </Link>
              <div className="shrink-0 px-1.5 pb-1.5 pt-1">
                <ConversationInviteButton
                  personId={person.id}
                  personName={person.name}
                  variant="compact"
                  className="h-7 w-full min-w-0 gap-0.5 overflow-hidden px-1 text-[11px] leading-none [&_svg]:h-3 [&_svg]:w-3"
                />
              </div>
            </article>
          );
        }}
      />
    </motion.div>
  );
}
