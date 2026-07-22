import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { MapCanvas } from "@/components/map-canvas";
import { places } from "@/lib/mock-data";
import { proximityLabel } from "@/lib/proximity";
import { Search, Star } from "lucide-react";
import { useState } from "react";

const filters = ["Todos", "Restaurantes", "Cafés", "Eventos", "Lojas"] as const;

export const Route = createFileRoute("/_app/locais")({
  head: () => ({ meta: [{ title: "Locais próximos — RotaMais Connecta" }] }),
  component: Locais,
});

function Locais() {
  const [f, setF] = useState<(typeof filters)[number]>("Todos");
  const list = f === "Todos" ? places : places.filter((p) => p.category === f);
  return (
    <div className="flex-1">
      <StatusBar />
      <header className="px-5 pt-1 pb-3">
        <h1 className="font-display text-xl font-bold">Locais próximos</h1>
      </header>

      <div className="px-5">
        <div className="rounded-full bg-secondary flex items-center gap-2 px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar locais ou eventos"
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      <div className="mt-3 px-5 flex gap-2 overflow-x-auto no-scrollbar">
        {filters.map((x) => (
          <button
            key={x}
            onClick={() => setF(x)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition ${
              f === x
                ? "bg-gradient-brand text-white border-transparent"
                : "bg-surface border-border text-muted-foreground"
            }`}
          >
            {x}
          </button>
        ))}
      </div>

      <div className="mt-4 px-5">
        <MapCanvas
          height={160}
          pins={[
            { x: 30, y: 60, kind: "place" },
            { x: 55, y: 40, kind: "event" },
            { x: 75, y: 65, kind: "promo" },
            { x: 20, y: 30, kind: "place" },
          ]}
        />
      </div>

      <ul className="mt-4 px-5 space-y-3 pb-4">
        {list.map((p) => (
          <li key={p.id}>
            <Link
              to="/local/$id"
              params={{ id: p.id }}
              className="block rounded-2xl bg-surface border border-border overflow-hidden shadow-soft"
            >
              <div className="flex gap-3">
                <img src={p.cover} alt="" className="h-24 w-28 object-cover" />
                <div className="flex-1 py-2.5 pr-3">
                  <div className="text-[11px] uppercase text-primary font-semibold">
                    {p.category}
                  </div>
                  <div className="font-display font-bold text-sm">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating}
                    </span>
                    <span>· {proximityLabel(p.distanceMeters)}</span>
                    <span>· {p.hours}</span>
                  </div>
                  {p.promo && (
                    <div className="mt-1.5 inline-flex rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {p.promo}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
