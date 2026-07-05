import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MapCanvas } from "@/components/map-canvas";
import { StatusBar } from "@/components/phone-frame";
import { ChevronLeft, MapPin, Search, Home as HomeIcon, Briefcase, Star } from "lucide-react";
import { suggestions } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/rota")({
  head: () => ({ meta: [{ title: "Rota — RotaMais" }] }),
  component: RotaPage,
});

function RotaPage() {
  const nav = useNavigate();
  return (
    <div className="flex-1 flex flex-col">
      <div className="relative">
        <MapCanvas
          height={280}
          pins={[
            { x: 20, y: 85, kind: "user", label: "Você" },
            { x: 40, y: 55, kind: "driver" },
            { x: 65, y: 40, kind: "driver" },
            { x: 30, y: 30, kind: "driver" },
          ]}
        />
        <div className="absolute top-0 left-0 right-0">
          <StatusBar />
        </div>
        <button className="absolute top-14 left-4 h-10 w-10 grid place-items-center rounded-full bg-white shadow-soft">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="-mt-6 relative bg-surface rounded-t-3xl px-5 pt-5 pb-4 border-t border-border">
        <div className="h-1 w-10 rounded-full bg-border mx-auto mb-4" />
        <h2 className="font-display text-lg font-bold mb-4">Para onde você vai?</h2>

        <div className="rounded-2xl border border-border bg-surface p-3 space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-success ring-4 ring-success/20" />
            <input defaultValue="Minha localização" className="flex-1 bg-transparent outline-none text-sm" />
          </div>
          <div className="border-t border-border" />
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
            <input placeholder="Digite o destino" defaultValue="Shopping Ibirapuera"
                   className="flex-1 bg-transparent outline-none text-sm" />
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {[
            { Icon: HomeIcon, label: "Casa" },
            { Icon: Briefcase, label: "Trabalho" },
            { Icon: Star, label: "Favoritos" },
          ].map(({ Icon, label }) => (
            <button key={label} className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-medium">
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <p className="mt-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sugestões</p>
        <ul className="mt-2 divide-y divide-border">
          {suggestions.map((s) => (
            <li key={s.label} className="flex items-center gap-3 py-3">
              <span className="h-9 w-9 grid place-items-center rounded-xl bg-accent text-lg">{s.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {s.distance}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <button
          onClick={() => nav({ to: "/matching" })}
          className="mt-5 w-full rounded-full bg-gradient-brand py-4 text-white font-semibold shadow-elegant">
          Confirmar destino
        </button>
      </div>
    </div>
  );
}
