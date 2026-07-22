import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import { PresenceDot } from "@/components/presence-dot";
import { CompatibilityBadge } from "./compatibility-badge";
import { DistanceBadge } from "./distance-badge";
import { MutualInterests } from "./mutual-interests";
import { ConnectButton } from "./connect-button";
import { FavoriteButton } from "./favorite-button";
import { IgnoreButton } from "./ignore-button";
import type { DiscoveryPerson } from "@/lib/discovery/discovery-types";

interface PeopleListProps {
  people: DiscoveryPerson[];
  onConnect: (id: string) => void;
  onFavorite: (id: string) => void;
  onIgnore: (id: string) => void;
  connectedIds: Set<string>;
  favoritedIds: Set<string>;
}

const container = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

export function PeopleList({
  people,
  onConnect,
  onFavorite,
  onIgnore,
  connectedIds,
  favoritedIds,
}: PeopleListProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-2">
      {people.map((person) => (
        <motion.article
          key={person.id}
          variants={itemVariant}
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft"
          aria-label={`Perfil de ${person.name}`}
        >
          <div className="relative shrink-0">
            <img
              src={person.photo}
              alt={`Foto de ${person.name}`}
              className="h-14 w-14 rounded-2xl object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5">
              <PresenceDot online={person.online} size={10} />
            </span>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold truncate">
                {person.name}, {person.age}
              </h3>
              <CompatibilityBadge
                score={person.compatibilityScore}
                tier={person.compatibilityTier}
                label={person.compatibilityLabel}
              />
            </div>

            {person.profession && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Briefcase className="h-3 w-3 shrink-0" />
                <span className="truncate">{person.profession}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <DistanceBadge meters={person.distanceMeters} />
              <MutualInterests interests={person.interests.slice(0, 2)} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <ConnectButton
              onClick={() => onConnect(person.id)}
              connected={connectedIds.has(person.id)}
            />
            <FavoriteButton
              onClick={() => onFavorite(person.id)}
              favorited={favoritedIds.has(person.id)}
            />
            <IgnoreButton onClick={() => onIgnore(person.id)} />
          </div>
        </motion.article>
      ))}
    </motion.div>
  );
}
