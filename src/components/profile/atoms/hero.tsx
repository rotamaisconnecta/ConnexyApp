import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Music, MapPin, Clock } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PresenceDot } from "@/components/presence-dot";
import { cn } from "@/lib/utils";
import { heroFade } from "@/components/profile/animations";

/* ─── Types ──────────────────────────────────────────────── */

type PhotoVariant = "pessoa" | "empresa" | "evento" | "motorista";

export interface HeroProps {
  photo: string;
  name: string;
  subtitle?: string;
  handle?: string;
  headline?: string;
  online?: boolean;
  lastSeen?: string;
  proximity?: string;
  radius?: string;
  badge?: ReactNode;
  mood?: { emoji: string; text: string };
  nowPlaying?: { kind: string; title: string; subtitle?: string };
  photoVariant?: PhotoVariant;
  gradientBg?: boolean;
}

/* ─── Photo config per variant ───────────────────────────── */

const PHOTO_VARIANTS: Record<PhotoVariant, { avatar: string; fallback: string; dotSize: number }> =
  {
    pessoa: { avatar: "h-24 w-24 rounded-3xl", fallback: "text-2xl", dotSize: 14 },
    empresa: { avatar: "h-20 w-20 rounded-2xl", fallback: "text-xl", dotSize: 12 },
    evento: { avatar: "h-48 w-full rounded-2xl object-cover", fallback: "text-2xl", dotSize: 10 },
    motorista: { avatar: "h-20 w-20 rounded-full", fallback: "text-xl", dotSize: 12 },
  };

/* ─── Component ──────────────────────────────────────────── */

export function Hero({
  photo,
  name,
  subtitle,
  handle,
  headline,
  online = false,
  lastSeen,
  proximity,
  radius,
  badge,
  mood,
  nowPlaying,
  photoVariant = "pessoa",
  gradientBg = false,
}: HeroProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isEvento = photoVariant === "evento";
  const cfg = PHOTO_VARIANTS[photoVariant];

  return (
    <motion.section
      variants={heroFade}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center text-center",
        isEvento ? "items-stretch text-left" : "px-4 pt-6 pb-4",
        gradientBg && !isEvento && "bg-gradient-brand rounded-3xl text-white -mx-4 px-4",
      )}
      aria-label={`Perfil de ${name}`}
    >
      {/* ── Photo ─────────────────────────────────────────── */}

      {isEvento ? (
        <div className="relative w-full overflow-hidden">
          <img src={photo} alt={`Banner de ${name}`} className="h-48 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="relative inline-block">
          <Avatar className={cn(cfg.avatar, "ring-2 ring-border", gradientBg && "ring-white/30")}>
            <AvatarImage src={photo} alt={`Foto de ${name}`} />
            <AvatarFallback className={cn("bg-gradient-brand text-white font-bold", cfg.fallback)}>
              {initials}
            </AvatarFallback>
          </Avatar>
          {online !== undefined && (
            <span className="absolute -bottom-0.5 -right-0.5">
              <PresenceDot online={online} size={cfg.dotSize} />
            </span>
          )}
        </div>
      )}

      {/* ── Text block ────────────────────────────────────── */}

      <div
        className={cn(
          "flex flex-col gap-1",
          isEvento ? "relative -mt-10 z-10 px-5 pb-4 text-white" : "mt-3",
        )}
      >
        {/* Name + Handle */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <h2 className="font-display text-xl font-bold leading-tight">{name}</h2>
          {online !== undefined && isEvento && <PresenceDot online={online} size={cfg.dotSize} />}
        </div>

        {subtitle && (
          <p
            className={cn(
              "text-sm",
              gradientBg || isEvento ? "text-white/80" : "text-muted-foreground",
            )}
          >
            {subtitle}
          </p>
        )}

        {handle && (
          <p
            className={cn(
              "text-xs font-medium",
              gradientBg || isEvento ? "text-white/60" : "text-primary",
            )}
          >
            {handle}
          </p>
        )}

        {/* Badge */}
        {badge && <div className="mt-1">{badge}</div>}

        {/* Headline */}
        {headline && (
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              gradientBg || isEvento ? "text-white/70" : "text-primary",
            )}
          >
            {headline}
          </p>
        )}

        {/* Mood */}
        {mood && (
          <p
            className={cn(
              "mt-1 text-xs italic",
              gradientBg || isEvento ? "text-white/60" : "text-muted-foreground",
            )}
          >
            {mood.emoji} {mood.text}
          </p>
        )}

        {/* Now Playing */}
        {nowPlaying && (
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 text-xs font-medium",
              gradientBg || isEvento ? "text-white/80" : "text-foreground",
            )}
          >
            <Music className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {nowPlaying.title}
              {nowPlaying.subtitle && (
                <span
                  className={cn(
                    "ml-1 font-normal",
                    gradientBg || isEvento ? "text-white/60" : "text-muted-foreground",
                  )}
                >
                  — {nowPlaying.subtitle}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Proximity + Radius */}
        {(proximity || radius) && (
          <div
            className={cn(
              "mt-2 flex items-center justify-center gap-3 text-[11px]",
              gradientBg || isEvento ? "text-white/60" : "text-muted-foreground",
            )}
          >
            {proximity && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {proximity}
              </span>
            )}
            {radius && <span className="inline-flex items-center gap-1">Raio {radius}</span>}
          </div>
        )}

        {/* Last Seen */}
        {lastSeen && !online && (
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-1 text-[11px]",
              gradientBg || isEvento ? "text-white/50" : "text-muted-foreground",
            )}
          >
            <Clock className="h-3 w-3" />
            {lastSeen}
          </span>
        )}
      </div>
    </motion.section>
  );
}
