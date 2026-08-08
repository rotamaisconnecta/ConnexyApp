import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { ArrowLeft } from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { PremiumCardView } from "@/components/feed/cards/premium-card";
import { buildFullPeopleCards } from "@/lib/feed/home-premium";

export const Route = createFileRoute("/_app/pessoas")({
  head: () => ({ meta: [{ title: "Pessoas — Connexy" }] }),
  component: Pessoas,
});

function Pessoas() {
  const cards = buildFullPeopleCards();

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
          <h1 className="font-display text-xl font-bold">👥 Pessoas Próximas</h1>
          <p className="text-[11px] text-muted-foreground">
            {cards.length} pessoas por perto de você
          </p>
        </div>
      </header>

      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <PremiumCardView key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
