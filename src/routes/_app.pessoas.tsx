import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/pessoas")({
  head: () => ({ meta: [{ title: "Pessoas — Connexy" }] }),
  component: Pessoas,
});

function Pessoas() {
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
        <h1 className="font-display text-xl font-bold">Pessoas Próximas</h1>
      </header>

      <div className="px-5 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          TODO: Tela completa de pessoas com filtros (idade, interesses, disponibilidade,
          compatibilidade).
        </p>
      </div>
    </div>
  );
}
