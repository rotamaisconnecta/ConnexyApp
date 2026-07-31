import { Link } from "@tanstack/react-router";
import { Clock, Gift, MapPin, Star, TrendingUp, Minus, Sparkles, Users } from "lucide-react";
import { KIND_EMOJI, KIND_LABELS, type PremiumCard } from "@/lib/feed/home-premium";
import { cn } from "@/lib/utils";

function TrendBadge({ trend }: { trend: NonNullable<PremiumCard["trend"]> }) {
  const Icon = trend === "up" ? TrendingUp : trend === "new" ? Sparkles : Minus;
  const color =
    trend === "up" ? "text-green-600" : trend === "new" ? "text-primary" : "text-muted-foreground";
  const label = trend === "up" ? "Em alta" : trend === "new" ? "Novo" : "Estável";
  return (
    <span className="absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gray-800 shadow-soft">
      <Icon className={cn("h-3 w-3", color)} />
      {label}
    </span>
  );
}

function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "promo";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        tone === "promo"
          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
          : "bg-secondary text-foreground",
      )}
    >
      {children}
    </span>
  );
}

function CardShell({ card }: { card: PremiumCard }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/50 bg-surface overflow-hidden transition-all duration-300 hover:shadow-elevated">
      {(card.photo || card.emoji) && (
        <div
          className="relative w-full"
          style={{ paddingBottom: card.kind === "person" ? "100%" : "82%" }}
        >
          {card.photo ? (
            <img
              src={card.photo}
              alt={card.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary/10 to-secondary/40 text-3xl">
              {card.emoji ?? KIND_EMOJI[card.kind]}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />

          {(card.badge || card.promo || card.kind !== "person") && (
            <span className="absolute top-2 left-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gray-800 shadow-soft">
              {card.badge ?? (card.promo ? "Promoção" : KIND_LABELS[card.kind])}
            </span>
          )}

          {card.trend && <TrendBadge trend={card.trend} />}

          {card.kind === "person" && card.online != null && (
            <span
              className={cn(
                "absolute bottom-2 right-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-soft",
                card.online ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700",
              )}
            >
              {card.online ? "Online" : "Offline"}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <div className="flex items-start justify-between gap-1.5">
          <span className="line-clamp-2 font-display text-sm font-bold leading-snug">
            {card.title}
          </span>
          {card.kind === "person" && card.compatibility != null && (
            <span className="shrink-0 text-[11px] font-bold text-primary">
              {card.compatibility}%
            </span>
          )}
        </div>

        {card.subtitle && (
          <span className="line-clamp-1 text-[11px] text-muted-foreground">{card.subtitle}</span>
        )}

        {card.category && card.kind !== "person" && (
          <span className="line-clamp-1 text-[11px] font-medium text-muted-foreground">
            {card.category}
          </span>
        )}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-1.5">
          {card.rating != null && (
            <Chip>
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              {card.rating}
            </Chip>
          )}
          {card.distance != null && card.distance !== undefined && (
            <Chip>
              <MapPin className="h-2.5 w-2.5 text-primary" />
              {card.distance}
            </Chip>
          )}
          {card.people != null && (
            <Chip>
              <Users className="h-2.5 w-2.5 text-primary" />
              {card.people}
            </Chip>
          )}
          {card.promo && (
            <Chip tone="promo">
              <Gift className="h-2.5 w-2.5" />
              {card.promo}
            </Chip>
          )}
          {card.hours && (
            <Chip>
              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
              {card.hours}
            </Chip>
          )}
        </div>
      </div>
    </div>
  );
}

export function PremiumCardView({ card }: { card: PremiumCard }) {
  if (card.route) {
    return (
      <Link
        to={card.route}
        className="block h-full rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-elevated active:scale-[0.98]"
      >
        <CardShell card={card} />
      </Link>
    );
  }

  return (
    <div className="h-full rounded-2xl overflow-hidden">
      <CardShell card={card} />
    </div>
  );
}
