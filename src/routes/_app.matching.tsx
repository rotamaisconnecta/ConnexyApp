import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { ChevronLeft, Star, MoreHorizontal } from "lucide-react";
import { drivers } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/_app/matching")({
  head: () => ({ meta: [{ title: "Motoristas próximos — RotaMais" }] }),
  component: Matching,
});

function Matching() {
  const nav = useNavigate();
  const [social, setSocial] = useState(true);
  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 pt-1 pb-3">
        <Link to="/rota" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-base">Motoristas disponíveis</h1>
          <p className="text-[11px] text-muted-foreground">3 próximos · destino Shopping Ibirapuera</p>
        </div>
      </div>

      <ul className="px-5 space-y-3">
        {drivers.map((d) => (
          <li key={d.id} className="rounded-2xl bg-surface border border-border p-3 shadow-soft flex items-center gap-3">
            <img src={d.photo} alt={d.name} className="h-14 w-14 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{d.name}</span>
                <span className="text-[11px] flex items-center gap-0.5 text-muted-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {d.rating}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">{d.eta} · {d.distance}</div>
              <div className="text-[11px] text-muted-foreground truncate">{d.car}</div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-sm">{d.price}</div>
              <button className="mt-1 rounded-full bg-gradient-brand text-white text-[11px] font-semibold px-3 py-1"
                      onClick={() => nav({ to: "/corrida" })}>
                Solicitar
              </button>
            </div>
            <button className="h-8 w-8 grid place-items-center text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 px-5">
        <div className="rounded-2xl bg-accent/50 border border-primary/20 p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">Viagem compartilhada</div>
            <div className="text-[11px] text-muted-foreground">Até 20% mais barato · combine com outros passageiros</div>
          </div>
          <button
            onClick={() => setSocial((s) => !s)}
            className={`h-6 w-11 rounded-full transition ${social ? "bg-primary" : "bg-border"} relative`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${social ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      <div className="mt-auto px-5 pb-4">
        <button
          onClick={() => nav({ to: "/corrida" })}
          className="w-full rounded-full bg-gradient-brand py-4 text-white font-semibold shadow-elegant">
          Confirmar corrida
        </button>
      </div>
    </div>
  );
}
