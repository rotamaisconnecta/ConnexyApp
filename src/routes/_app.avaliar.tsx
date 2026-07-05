import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { drivers } from "@/lib/mock-data";
import { Star } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/avaliar")({
  head: () => ({ meta: [{ title: "Avaliar corrida — RotaMais" }] }),
  component: Rate,
});

function Rate() {
  const nav = useNavigate();
  const d = drivers[0];
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("Ótima viagem!");
  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />
      <div className="px-6 pt-6 flex-1">
        <div className="flex flex-col items-center text-center">
          <img src={d.photo} alt="" className="h-20 w-20 rounded-full object-cover" />
          <div className="mt-3 font-semibold">{d.name}</div>
          <div className="text-[11px] text-muted-foreground">{d.car} · {d.plate}</div>
        </div>

        <h1 className="mt-8 font-display text-xl font-bold text-center">Como foi sua viagem?</h1>

        <div className="mt-4 flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}>
              <Star className={`h-9 w-9 ${n <= rating ? "fill-primary text-primary" : "text-border"}`} />
            </button>
          ))}
        </div>

        <label className="mt-6 block">
          <span className="text-xs font-medium text-muted-foreground">Deixe um comentário (opcional)</span>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
            className="mt-1 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {["Motorista simpático", "Carro limpo", "Rota rápida", "Boa conversa"].map((t) => (
            <button key={t} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium">
              + {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-4">
        <button
          onClick={() => nav({ to: "/home" })}
          className="w-full rounded-full bg-gradient-brand py-4 text-white font-semibold shadow-elegant">
          Finalizar
        </button>
      </div>
    </div>
  );
}
