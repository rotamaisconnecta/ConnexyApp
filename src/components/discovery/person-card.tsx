import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import { PresenceDot } from "@/components/presence-dot";
import { CompatibilityBadge } from "./compatibility-badge";
import { DistanceBadge } from "./distance-badge";
import { MutualInterests } from "./mutual-interests";
import { MomentPreview } from "./moment-preview";
import { ConnectButton } from "./connect-button";
import { FavoriteButton } from "./favorite-button";
import { IgnoreButton } from "./ignore-button";
import type { DiscoveryPerson } from "@/lib/discovery/discovery-types";
import { cardHover } from "@/components/profile/animations";

interface PersonCardProps {
  person: DiscoveryPerson;
  onConnect: (id: string) => void;
  onFavorite: (id: string) => void;
  onIgnore: (id: string) => void;
  connected?: boolean;
  favorited?: boolean;
}

export function PersonCard({
  person,
  onConnect,
  onFavorite,
  onIgnore,
  connected = false,
  favorited = false,
}: PersonCardProps) {
  return (
    <motion.article
      variants={cardHover}
      whileHover="whileHover"
      className="rounded-3xl border border-border bg-surface shadow-soft overflow-hidden"
      aria-label={`Perfil de ${person.name}, ${person.age} anos`}
    >
      {/* Photo */}
      <div className="relative">
        <img
          src={person.photo}
          alt={`Foto de ${person.name}`}
          className="h-40 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Online dot */}
        <span className="absolute top-2.5 right-2.5">
          <PresenceDot online={person.online} size={10} />
        </span>

        {/* Compatibility badge */}
        <div className="absolute bottom-2.5 left-2.5">
          <CompatibilityBadge
            score={person.compatibilityScore}
            tier={person.compatibilityTier}
            label={person.compatibilityLabel}
          />
        </div>

        {/* Distance */}
        <div className="absolute bottom-2.5 right-2.5">
          <DistanceBadge meters={person.distanceMeters} />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Name + Age */}
        <div className="flex items-center gap-1.5">
          <h3 className="font-display text-sm font-bold truncate">
            {person.name}, {person.age}
          </h3>
          {person.online && <span className="text-[10px] text-success font-medium">online</span>}
        </div>

        {/* Profession */}
        {person.profession && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Briefcase className="h-3 w-3 shrink-0" />
            <span className="truncate">{person.profession}</span>
          </div>
        )}

        {/* Headline */}
        {person.headline && (
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
            {person.headline}
          </p>
        )}

        {/* Moment */}
        {person.moment && <MomentPreview moment={person.moment} />}

        {/* Mutual Interests */}
        <MutualInterests interests={person.interests.slice(0, 3)} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-3 pb-3">
        <div className="flex-1">
          <ConnectButton onClick={() => onConnect(person.id)} connected={connected} />
        </div>
        <FavoriteButton onClick={() => onFavorite(person.id)} favorited={favorited} />
        <IgnoreButton onClick={() => onIgnore(person.id)} />
      </div>
    </motion.article>
  );
}
