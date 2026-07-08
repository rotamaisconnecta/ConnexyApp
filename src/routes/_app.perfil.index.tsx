import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { currentUser } from "@/lib/mock-data";
import { ChevronRight, MapPinned, Users, Bookmark, Settings, EyeOff } from "lucide-react";

export const Route = createFileRoute("/_app/perfil/")({
  head: () => ({ meta: [{ title: "Perfil — RotaMais Connecta" }] }),
  component: Profile,
});

function Profile() {
  return (
    <div className="flex-1">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center justify-between">
        <h1 className="font-display font-bold text-lg">Perfil</h1>
        <Link to="/privacidade" className="text-xs font-semibold text-primary">Editar</Link>
      </header>

      <div className="mx-5 rounded-3xl bg-gradient-brand p-5 text-white shadow-elegant">
        <div className="flex items-center gap-4">
          <img src={currentUser.photo} alt="" className="h-16 w-16 rounded-full ring-4 ring-white/30 object-cover" />
          <div className="flex-1">
            <div className="font-display text-lg font-bold">{currentUser.name}</div>
            <div className="text-xs opacity-90">Ver perfil público</div>
          </div>
          <ChevronRight className="h-5 w-5 opacity-80" />
        </div>
        <div className="mt-5 grid grid-cols-3 text-center">
          <Stat n={currentUser.rating} l="Avaliação" />
          <Stat n={currentUser.trips} l="Corridas" divider />
          <Stat n={currentUser.connections} l="Conexões" />
        </div>
      </div>

      <div className="mt-5 mx-5 rounded-2xl bg-surface border border-border divide-y divide-border">
        <Item icon={MapPinned} label="Minhas viagens" hint="Histórico e avaliações" />
        <Item icon={Users} label="Conexões" hint="Pessoas que você conectou" />
        <Item icon={Bookmark} label="Locais favoritos" hint="Seus lugares salvos" />
        <Link to="/privacidade">
          <Item icon={EyeOff} label="Modo invisível" hint="Configure sua visibilidade" />
        </Link>
        <Link to="/privacidade">
          <Item icon={Settings} label="Configurações" hint="Privacidade, notificações, etc." />
        </Link>
      </div>

      <div className="mt-5 mx-5 rounded-2xl bg-accent/40 border border-primary/20 p-4">
        <div className="text-xs font-semibold text-primary">Interesses</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {currentUser.interests.map((t) => (
            <span key={t} className="rounded-full bg-surface text-primary text-xs font-semibold px-3 py-1 border border-primary/20">{t}</span>
          ))}
        </div>
      </div>

      <div className="h-6" />
    </div>
  );
}

function Stat({ n, l, divider }: { n: number | string; l: string; divider?: boolean }) {
  return (
    <div className={`${divider ? "border-x border-white/25" : ""}`}>
      <div className="font-display font-bold text-lg">{n}</div>
      <div className="text-[11px] opacity-90">{l}</div>
    </div>
  );
}

function Item({ icon: Icon, label, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="h-9 w-9 grid place-items-center rounded-xl bg-accent text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
