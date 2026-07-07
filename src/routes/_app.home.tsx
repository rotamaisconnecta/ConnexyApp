import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ChevronDown, Search } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { MapCanvas } from "@/components/map-canvas";
import { people, places, notifications, currentUser } from "@/lib/mock-data";
import { personProximityLabel } from "@/lib/proximity";
import { PresenceDot } from "@/components/presence-dot";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Home — RotaMais Connecta" },
      { name: "description", content: "Seu feed de pessoas, eventos e promoções por perto." },
    ],
  }),
  component: Home,
});

function Home() {
  const nearbyPlaces = places.filter((p) => p.category !== "Eventos").slice(0, 3);

  return (
    <div className="flex-1">
      <StatusBar />
      <header className="px-5 pt-2 pb-3 flex items-center justify-between">
        <button className="flex items-center gap-1 text-sm font-semibold">
          <span>São Paulo, SP</span>
          <ChevronDown className="h-4 w-4" />
        </button>
        <Link to="/notificacoes" className="relative h-10 w-10 grid place-items-center rounded-full bg-secondary">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-pink" />
        </Link>
      </header>

      {/* Pessoas próximas — destaque principal */}
      <section className="mt-1 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold">Pessoas próximas</h2>
          <Link to="/connecta" className="text-xs font-semibold text-primary">Ver todas</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
          {people.slice(0, 6).map((p) => (
            <Link to="/solicitacao/$id" params={{ id: p.id }} key={p.id}
                  className="shrink-0 w-24 flex flex-col items-center gap-1.5">
              <div className="relative">
                <img src={p.photo} alt={p.name} className="h-18 w-18 rounded-full object-cover ring-2 ring-primary/40" style={{ height: 72, width: 72 }} />
                <PresenceDot online={p.online} className="absolute -bottom-0.5 -right-0.5" />
              </div>
              <span className="text-xs font-semibold truncate w-full text-center">{p.name}</span>
              <span className="text-[10px] text-primary font-semibold -mt-1 text-center leading-tight">{proximityLabel(p.distanceMeters)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Eventos perto */}
      <section className="mt-5 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-bold">Eventos perto de você</h2>
          <Link to="/locais" className="text-xs font-semibold text-primary">Ver todos</Link>
        </div>
        <Link to="/local/$id" params={{ id: places[1].id }} className="block rounded-2xl bg-surface border border-border overflow-hidden shadow-soft">
          <div className="flex gap-3">
            <img src={places[1].cover} alt="" className="h-20 w-24 object-cover" />
            <div className="flex-1 py-2 pr-3">
              <div className="text-[11px] uppercase font-semibold text-primary">Evento</div>
              <div className="font-display font-bold text-sm">{places[1].name}</div>
              <div className="text-xs text-muted-foreground">Parque Ibirapuera · {places[1].hours}</div>
              <div className="text-[11px] mt-1 text-muted-foreground">📍 {proximityLabel(places[1].distanceMeters)}</div>
            </div>
          </div>
        </Link>
      </section>

      {/* Locais próximos */}
      <section className="mt-5 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-bold">Locais próximos</h2>
          <Link to="/locais" className="text-xs font-semibold text-primary">Ver todos</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
          {nearbyPlaces.map((pl) => (
            <Link
              key={pl.id}
              to="/local/$id"
              params={{ id: pl.id }}
              className="shrink-0 w-44 rounded-2xl bg-surface border border-border overflow-hidden shadow-soft"
            >
              <img src={pl.cover} alt={pl.name} className="h-24 w-full object-cover" />
              <div className="p-2.5">
                <div className="text-[10px] uppercase font-semibold text-primary">{pl.category}</div>
                <div className="font-display font-bold text-sm truncate">{pl.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">📍 {proximityLabel(pl.distanceMeters)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Promoções */}
      <section className="mt-5 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-bold">Promoções para você</h2>
          <Link to="/locais" className="text-xs font-semibold text-primary">Ver todas</Link>
        </div>
        <Link to="/local/$id" params={{ id: places[0].id }} className="block rounded-2xl bg-gradient-brand p-4 text-white shadow-elegant relative overflow-hidden">
          <div className="text-[11px] uppercase opacity-90">Café Central · {proximityLabel(places[0].distanceMeters)}</div>
          <div className="font-display text-2xl font-bold mt-1">20% OFF</div>
          <div className="text-sm opacity-90">em cafés especiais até 23:00</div>
        </Link>
      </section>

      {/* Notificações preview */}
      <section className="mt-5 px-5">
        <h2 className="font-display text-base font-bold mb-3">Ao seu redor agora</h2>
        <ul className="space-y-2">
          {notifications.slice(0, 2).map((n) => (
            <li key={n.id} className="rounded-2xl bg-surface border border-border p-3 text-sm flex items-start gap-3">
              <span className="h-8 w-8 shrink-0 grid place-items-center rounded-full bg-accent text-primary text-xs">•</span>
              <div className="flex-1">
                <div className="text-sm">{n.text}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{n.time}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Mobilidade — última seção (estilo Uber) */}
      <section className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-bold">Precisa de uma corrida?</h2>
          <Link to="/rota" className="text-xs font-semibold text-primary">Abrir RotaMais</Link>
        </div>
        <Link to="/rota" className="block relative rounded-2xl overflow-hidden shadow-elegant border border-border">
          <MapCanvas
            height={160}
            pins={[
              { x: 45, y: 70, kind: "user", label: "Você" },
              { x: 25, y: 45, kind: "driver" },
              { x: 70, y: 55, kind: "driver" },
              { x: 55, y: 30, kind: "driver" },
            ]}
          />
          <div className="absolute inset-x-2 bottom-2">
            <div className="rounded-xl bg-white/95 backdrop-blur px-3 py-2.5 flex items-center gap-2 shadow-soft">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Para onde você vai?</span>
            </div>
          </div>
        </Link>
      </section>

      <div className="h-6" />
      <p className="text-center text-[11px] text-muted-foreground">Olá, {currentUser.name.split(" ")[0]} — bom te ver por aqui ✨</p>
      <div className="h-4" />
    </div>
  );
}
