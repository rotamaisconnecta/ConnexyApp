import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { PremiumCardView } from "@/components/feed/cards/premium-card";
import { buildTrendingCards } from "@/lib/feed/home-premium";

export const Route = createFileRoute("/_app/trending")({
  head: () => ({ meta: [{ title: "Em Alta — Connexy" }] }),
  component: TrendingPage,
});

function TrendingPage() {
  const cards = buildTrendingCards();

  return (
    <div className="flex-1">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <Link
          to="/home"
          className="h-10 w-10 grid place-items-center rounded-full bg-secondary"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold">🔥 Em Alta</h1>
          <p className="text-[11px] text-muted-foreground">
            Feed trending: eventos, negócios, pessoas, locais, promoções e publicações
          </p>
        </div>
      </header>

      <div className="px-4 pb-6">
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <p className="text-xs text-foreground">
            Ranqueado por popularidade e atividade na sua região.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <PremiumCardView key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
