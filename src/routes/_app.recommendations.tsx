import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { ArrowLeft, Sparkles } from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { useEffect, useMemo, useState } from "react";
import { PremiumCardView } from "@/components/feed/cards/premium-card";
import {
  buildRecommendationCards,
  KIND_LABELS,
  type PremiumCardKind,
} from "@/lib/feed/home-premium";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/recommendations")({
  head: () => ({ meta: [{ title: "Recomendações — Connexy" }] }),
  component: RecommendationsPage,
});

function brasiliaMinutes(): number {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function filtersForMinute(minuteOfDay: number): { title: string; kinds: PremiumCardKind[] } {
  if (minuteOfDay >= 7 * 60 && minuteOfDay <= 11 * 60) {
    return { title: "Sugestões para a manhã", kinds: ["cafe", "gym", "promotion"] };
  }
  if (minuteOfDay > 11 * 60 && minuteOfDay <= 17 * 60) {
    return {
      title: "Sugestões para a tarde",
      kinds: ["business", "bar", "store", "service", "promotion"],
    };
  }
  return {
    title: "Sugestões para a noite",
    kinds: [
      "business",
      "bar",
      "store",
      "service",
      "gym",
      "cinema",
      "sponsored-event",
      "place",
      "promotion",
    ],
  };
}

function RecommendationsPage() {
  const cards = buildRecommendationCards();
  const [minuteOfDay, setMinuteOfDay] = useState(brasiliaMinutes);
  const recommendationWindow = filtersForMinute(minuteOfDay);
  const [active, setActive] = useState<PremiumCardKind>(recommendationWindow.kinds[0]);

  useEffect(() => {
    const timer = window.setInterval(() => setMinuteOfDay(brasiliaMinutes()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!recommendationWindow.kinds.includes(active)) setActive(recommendationWindow.kinds[0]);
  }, [active, recommendationWindow.kinds]);

  const filtered = useMemo(() => cards.filter((card) => card.kind === active), [cards, active]);

  return (
    <div className="flex-1">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <BackButton
          fallbackTo="/home"
          className="h-10 w-10 grid place-items-center rounded-full bg-secondary"
          ariaLabel="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </BackButton>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold">💡 Recomendações</h1>
          <p className="text-[11px] text-muted-foreground">
            {recommendationWindow.title} · horário de Brasília
          </p>
        </div>
      </header>

      <div className="px-5">
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-gradient-brand px-4 py-3 shadow-soft">
          <Sparkles className="h-4 w-4 text-white" />
          <p className="text-xs text-white">
            Ranqueado por avaliação, proximidade, pessoas presentes e seus interesses.
          </p>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          {recommendationWindow.kinds.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setActive(kind)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                active === kind
                  ? "border-transparent bg-gradient-brand text-white shadow-soft"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              {KIND_LABELS[kind]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((card) => (
            <PremiumCardView key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
