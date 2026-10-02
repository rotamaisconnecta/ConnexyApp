import { Link } from "@tanstack/react-router";
import { Clock, Gift, MapPin, Star, TrendingUp, Minus, Sparkles, Users } from "lucide-react";
import {
  KIND_EMOJI,
  KIND_LABELS,
  type PremiumCard,
  type PremiumCardKind,
} from "@/lib/feed/home-premium";
import { resolvePremiumCardRoute } from "@/lib/navigation/detail-routes";
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
        "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-snug",
        tone === "promo"
          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
          : "bg-secondary text-foreground",
      )}
    >
      {children}
    </span>
  );
}

function CardShell({ card, compact = false }: { card: PremiumCard; compact?: boolean }) {
  const isPerson = card.kind === "person";
  const bodyText = card.subtitle;

  return (
    <div className="flex min-h-[inherit] flex-col rounded-[24px] border border-border/50 bg-surface transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
      {(card.photo || card.emoji) && (
        <div
          className={cn(
            "relative w-full shrink-0 overflow-hidden rounded-t-[24px]",
            compact ? "h-[132px]" : "h-[200px]",
          )}
        >
          {card.photo ? (
            <img
              src={card.photo}
              alt={card.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-primary/10 to-secondary/40 text-4xl">
              {card.emoji ?? KIND_EMOJI[card.kind]}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />

          {(card.badge || card.promo || !isPerson) && (
            <span className="absolute top-3 left-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-gray-800 shadow-soft">
              {card.badge ?? (card.promo ? "Promoção" : KIND_LABELS[card.kind])}
            </span>
          )}

          {card.trend && <TrendBadge trend={card.trend} />}

          {isPerson && card.online != null && (
            <span
              className={cn(
                "absolute bottom-3 right-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-soft",
                card.online ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700",
              )}
            >
              {card.online ? "Online" : "Offline"}
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          compact ? "gap-1 px-3.5 py-2.5" : "gap-1.5 px-6 py-4",
        )}
      >
        <span
          className={cn(
            "font-display font-bold leading-snug",
            compact ? "text-[13px]" : "text-[15px]",
          )}
        >
          {card.title}
        </span>

        {bodyText ? (
          <span className={cn("leading-snug text-muted-foreground", compact ? "text-[11px]" : "text-xs")}>
            {bodyText}
          </span>
        ) : null}

        {isPerson && card.category && card.category !== "Pessoas" ? (
          <span className={cn("leading-snug text-muted-foreground/90", compact ? "text-[11px]" : "text-xs")}>
            Interesses: {card.category}
          </span>
        ) : null}

        {isPerson && card.commonalities && card.commonalities.total > 0 && (
          <span className="text-[11px] font-medium leading-snug text-primary">
            {card.commonalities.total}{" "}
            {card.commonalities.total === 1 ? "coisa em comum" : "coisas em comum"}
          </span>
        )}

        {isPerson && card.compatibility != null && (
          <span className="text-[12px] font-semibold leading-none text-primary">
            Compatibilidade {card.compatibility}%
          </span>
        )}

        {!isPerson && card.category && card.badge !== card.category ? (
          <span className={cn("leading-snug text-muted-foreground", compact ? "text-[11px]" : "text-xs")}>
            {card.category}
          </span>
        ) : null}

        <div className="mt-1 flex flex-wrap gap-1">
          {card.rating != null && (
            <Chip>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {card.rating}
            </Chip>
          )}
          {card.distance != null && (
            <Chip>
              <MapPin className="h-3 w-3 shrink-0 text-primary" />
              {card.distance}
            </Chip>
          )}
          {card.people != null && (
            <Chip>
              <Users className="h-3 w-3 shrink-0 text-primary" />
              {card.people}
            </Chip>
          )}
          {card.promo && (
            <Chip tone="promo">
              <Gift className="h-3 w-3 shrink-0" />
              {card.promo}
            </Chip>
          )}
          {card.hours && (
            <Chip>
              <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
              {card.hours}
            </Chip>
          )}
        </div>

        <div
          className={cn(
            "mt-auto w-full rounded-full bg-primary/10 text-primary font-semibold grid place-items-center transition-colors hover:bg-primary/20",
            compact ? "h-9 text-[12px]" : "h-12 text-[13px]",
          )}
        >
          {CTA_LABEL[card.kind]}
        </div>
      </div>
    </div>
  );
}

export function PremiumCardView({ card, compact }: { card: PremiumCard; compact?: boolean }) {
  const route = resolvePremiumCardRoute(card);

  if (route) {
    return (
      <Link
        to={route}
        className="block min-h-[inherit] rounded-[24px] transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
      >
        <CardShell card={card} compact={compact} />
      </Link>
    );
  }

  return (
    <div className="min-h-[inherit] rounded-[24px]">
      <CardShell card={card} compact={compact} />
    </div>
  );
}
