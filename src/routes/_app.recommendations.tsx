import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { ArrowLeft, Sparkles } from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { useMemo, useState } from "react";
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

const ALL: PremiumCardKind[] = [
  "restaurant",
  "promotion",
  "business",
  "place",
  "sponsored-event",
  "hotel",
  "gym",
  "cinema",
  "bar",
  "store",
  "cafe",
  "service",
];

const FILTERS: Array<{ kind?: PremiumCardKind; label: string }> = [
  { label: "Todos" },
  ...ALL.map((kind) => ({ kind, label: KIND_LABELS[kind] })),
];

function RecommendationsPage() {
  const cards = buildRecommendationCards();
  const [active, setActive] = useState<string>("Todos");

  const filtered = useMemo(
    () => (active === "Todos" ? cards : cards.filter((card) => KIND_LABELS[card.kind] === active)),
    [cards, active],
  );

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
          <p className="text-[11px] text-muted-foreground">Feed inteligente curado para você</p>
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
          {FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => setActive(filter.label)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                active === filter.label
                  ? "border-transparent bg-gradient-brand text-white shadow-soft"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              {filter.label}
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
