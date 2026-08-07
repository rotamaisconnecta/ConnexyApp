import { Link } from "@tanstack/react-router";
import { Clock, Gift, MapPin, Star, TrendingUp, Minus, Sparkles, Users } from "lucide-react";
import {
  KIND_EMOJI,
  KIND_LABELS,
  type PremiumCard,
  type PremiumCardKind,
} from "@/lib/feed/home-premium";
import { cn } from "@/lib/utils";

const CTA_LABEL: Record<PremiumCardKind, string> = {
  restaurant: "Ver restaurante",
  promotion: "Ver oferta",
  business: "Ver negócio",
  place: "Ver local",
  "sponsored-event": "Ver evento",
  event: "Ver evento",
  hotel: "Ver hotel",
  gym: "Ver academia",
  cinema: "Ver filme",
  bar: "Ver bar",
  store: "Ver loja",
  cafe: "Ver cafeteria",
  service: "Ver serviço",
  person: "Ver perfil",
  post: "Ler publicação",
};

function TrendBadge({ trend }: { trend: NonNullable<PremiumCard["trend"]> }) {
  const Icon = trend === "up" ? TrendingUp : trend === "new" ? Sparkles : Minus;
  const color =
    trend === "up" ? "text-green-600" : trend === "new" ? "text-primary" : "text-muted-foreground";
  const label = trend === "up" ? "Em alta" : trend === "new" ? "Novo" : "Estável";
  return (
    <span className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-gray-800 shadow-soft">
      <Icon className={cn("h-3.5 w-3.5", color)} />
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
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
  const metaLine = card.subtitle ?? card.category;

  return (
    <div className="flex h-full flex-col rounded-[20px] border border-border/50 bg-surface overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
      {(card.photo || card.emoji) && (
        <div className="relative w-full shrink-0" style={{ height: "50%" }}>
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
            <span className="absolute top-2.5 left-2.5 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-gray-800 shadow-soft">
              {card.badge ?? (card.promo ? "Promoção" : KIND_LABELS[card.kind])}
            </span>
          )}

          {card.trend && <TrendBadge trend={card.trend} />}

          {card.kind === "person" && card.online != null && (
            <span
              className={cn(
                "absolute bottom-2.5 right-2.5 z-10 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-soft",
                card.online ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700",
              )}
            >
              {card.online ? "Online" : "Offline"}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1 px-4 py-3 min-h-0">
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 font-display text-sm font-bold leading-snug">
            {card.title}
          </span>
          {card.kind === "person" && card.compatibility != null && (
            <span className="shrink-0 text-[11px] font-bold text-primary">{card.compatibility}%</span>
          )}
        </div>

        {metaLine && <span className="line-clamp-1 text-[11px] text-muted-foreground">{metaLine}</span>}

        <div className="mt-1 flex flex-nowrap gap-1.5 overflow-hidden">
          {card.rating != null && (
            <Chip>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {card.rating}
            </Chip>
          )}
          {card.distance != null && (
            <Chip>
              <MapPin className="h-3 w-3 text-primary" />
              {card.distance}
            </Chip>
          )}
          {card.people != null && (
            <Chip>
              <Users className="h-3 w-3 text-primary" />
              {card.people}
            </Chip>
          )}
          {card.promo && (
            <Chip tone="promo">
              <Gift className="h-3 w-3" />
              {card.promo}
            </Chip>
          )}
          {card.hours && (
            <Chip>
              <Clock className="h-3 w-3 text-muted-foreground" />
              {card.hours}
            </Chip>
          )}
        </div>

        <div className="mt-auto h-10 w-full rounded-full bg-primary/10 text-primary text-xs font-semibold grid place-items-center transition-colors hover:bg-primary/20">
          {CTA_LABEL[card.kind]}
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
        className="block h-full rounded-[24px] overflow-hidden transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
      >
        <CardShell card={card} />
      </Link>
    );
  }

  return (
    <div className="h-full rounded-[24px] overflow-hidden">
      <CardShell card={card} />
    </div>
  );
}
