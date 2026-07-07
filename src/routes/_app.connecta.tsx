import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { people } from "@/lib/mock-data";
import { proximityTone, personProximityLabel, personProximityRadius } from "@/lib/proximity";
import { PresenceDot } from "@/components/presence-dot";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/_app/connecta")({
  head: () => ({ meta: [{ title: "Connecta — Pessoas próximas" }] }),
  component: Connecta,
});

function Connecta() {
  const [tab, setTab] = useState<"pessoas" | "solicitacoes">("pessoas");
  return (
    <div className="flex-1">
      <StatusBar />
      <header className="px-5 pt-1 pb-3">
        <h1 className="font-display text-xl font-bold">Connecta</h1>
        <p className="text-xs text-muted-foreground">Pessoas próximas a você agora</p>
      </header>

      <div className="px-5 flex items-center gap-2">
        <div className="flex-1 flex rounded-full bg-secondary p-1">
          {(["pessoas", "solicitacoes"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-2 text-xs font-semibold capitalize ${tab === t ? "bg-surface shadow-soft text-foreground" : "text-muted-foreground"}`}>
              {t === "pessoas" ? "Pessoas" : "Solicitações"}
            </button>
          ))}
        </div>
        <button className="h-10 w-10 grid place-items-center rounded-full bg-secondary">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <ul className="mt-4 px-5 space-y-3 pb-4">
        {people.map((p) => (
          <li key={p.id} className="rounded-2xl bg-surface border border-border p-3 shadow-soft flex items-center gap-3">
            <div className="relative">
              <img src={p.photo} alt={p.name} className="h-14 w-14 rounded-full object-cover" />
              <PresenceDot online={p.online} className="absolute -bottom-0.5 -right-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{p.name}, {p.age}</div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${proximityTone(p.distanceMeters)}`}>
                  {personProximityLabel(p.distanceMeters)}
                </span>
                {(() => {
                  const radius = personProximityRadius(p.distanceMeters);
                  return radius ? (
                    <span className="text-[10px] text-muted-foreground">· {radius}</span>
                  ) : null;
                })()}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {p.interests.slice(0, 2).map((t) => (
                  <span key={t} className="rounded-full bg-accent text-primary text-[10px] font-semibold px-2 py-0.5">{t}</span>
                ))}
              </div>
            </div>
            <Link to="/solicitacao/$id" params={{ id: p.id }}
                  className="rounded-full bg-gradient-brand text-white text-xs font-semibold px-4 py-2 shadow-soft">
              Conectar
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
