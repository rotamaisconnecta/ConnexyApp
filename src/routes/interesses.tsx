import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame, StatusBar } from "@/components/phone-frame";
import { ChevronLeft } from "lucide-react";
import { allInterests } from "@/lib/mock-data";

export const Route = createFileRoute("/interesses")({
  head: () => ({ meta: [{ title: "Interesses — RotaMais Connecta" }] }),
  component: Interests,
});

function Interests() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<string[]>(["Viagens", "Socializar", "Eventos", "Música"]);
  const toggle = (t: string) =>
    setSelected((s) => s.includes(t) ? s.filter(x => x !== t) : [...s, t]);

  return (
    <PhoneFrame>
      <StatusBar />
      <div className="flex items-center justify-between px-5 pt-2 pb-4">
        <Link to="/cadastro" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <span className="text-xs text-muted-foreground">Passo 2 de 3</span>
        <span className="w-9" />
      </div>

      <div className="px-6 flex-1 flex flex-col">
        <h1 className="font-display text-2xl font-bold">Quase lá! 😊</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione 3 ou mais interesses para conectarmos você com pessoas afins.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {allInterests.map((t) => {
            const on = selected.includes(t);
            return (
              <button key={t} onClick={() => toggle(t)}
                className={`rounded-full px-4 py-2 text-sm font-medium border transition ${on
                  ? "bg-gradient-brand text-white border-transparent shadow-soft"
                  : "bg-surface text-foreground border-border"}`}>
                {t}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-6 pb-6 space-y-3">
          <div className="text-xs text-muted-foreground text-center">
            {selected.length} selecionados
          </div>
          <button
            onClick={() => nav({ to: "/localizacao" })}
            disabled={selected.length < 3}
            className="w-full rounded-full bg-gradient-brand py-4 text-white font-semibold shadow-elegant disabled:opacity-50">
            Finalizar
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
