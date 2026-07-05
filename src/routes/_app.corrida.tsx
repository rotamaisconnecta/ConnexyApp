import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapCanvas } from "@/components/map-canvas";
import { StatusBar } from "@/components/phone-frame";
import { drivers, places } from "@/lib/mock-data";
import { proximityLabel } from "@/lib/proximity";
import { MessageCircle, Shield, Users } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/corrida")({
  head: () => ({ meta: [{ title: "Corrida ativa — RotaMais" }] }),
  component: RideActive,
});

function RideActive() {
  const nav = useNavigate();
  const d = drivers[0];
  const [social, setSocial] = useState(false);
  return (
    <div className="flex-1 flex flex-col">
      <div className="relative">
        <MapCanvas
          height={280}
          route
          pins={[
            { x: 15, y: 88, kind: "user", label: "Você" },
            { x: 30, y: 70, kind: "driver", label: `Chega em 2 min` },
            { x: 85, y: 15, kind: "place", label: "Destino" },
          ]}
        />
        <div className="absolute top-0 left-0 right-0">
          <StatusBar />
        </div>
        <div className="absolute top-14 left-1/2 -translate-x-1/2 rounded-full bg-surface/95 backdrop-blur px-4 py-1.5 text-xs font-semibold shadow-soft">
          Chegando em 2 min · 0,4 km
        </div>
        <button className="absolute top-14 right-4 h-10 w-10 grid place-items-center rounded-full bg-destructive text-white shadow-elegant">
          <Shield className="h-4 w-4" />
        </button>
      </div>

      <div className="-mt-4 relative bg-surface rounded-t-3xl px-5 pt-4 pb-3">
        <div className="h-1 w-10 rounded-full bg-border mx-auto mb-4" />

        <div className="flex items-center gap-3">
          <img src={d.photo} className="h-14 w-14 rounded-full object-cover" alt="" />
          <div className="flex-1">
            <div className="font-semibold">{d.name}</div>
            <div className="text-[11px] text-muted-foreground">{d.car} · {d.plate}</div>
          </div>
          <div className="flex gap-2">
            <button className="h-11 w-11 grid place-items-center rounded-full bg-secondary">
              <MessageCircle className="h-4 w-4" />
            </button>
            <button className="h-11 w-11 grid place-items-center rounded-full bg-secondary">
              <Shield className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-primary/20 bg-accent/40 p-3 flex items-center gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/15 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Modo Social</div>
            <div className="text-[11px] text-muted-foreground">Ver pessoas indo na mesma rota</div>
          </div>
          <button onClick={() => setSocial((s) => !s)}
                  className={`h-6 w-11 rounded-full ${social ? "bg-primary" : "bg-border"} relative transition`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${social ? "left-5" : "left-0.5"}`} />
          </button>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wide mb-2">Sugestão no seu destino</p>
          <div className="rounded-2xl border border-border overflow-hidden flex">
            <img src={places[0].cover} className="h-20 w-24 object-cover" alt="" />
            <div className="flex-1 p-2.5">
              <div className="font-semibold text-sm">{places[0].name}</div>
              <div className="text-[11px] text-muted-foreground">{proximityLabel(places[0].distanceMeters)} · ⭐ {places[0].rating}</div>
              <div className="text-[11px] text-primary font-semibold mt-0.5">20% OFF · ver no mapa</div>
            </div>
          </div>
        </div>

        <button
          onClick={() => nav({ to: "/avaliar" })}
          className="mt-4 w-full rounded-full bg-gradient-brand py-3.5 text-white font-semibold shadow-elegant">
          Finalizar corrida (demo)
        </button>
      </div>
    </div>
  );
}
