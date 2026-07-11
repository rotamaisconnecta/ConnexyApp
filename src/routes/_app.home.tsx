import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, MessageSquare, ChevronDown, Search, Home as HomeIcon, Briefcase, MoreHorizontal, Car, Users, Ticket, Tag, Store, Compass, SlidersHorizontal, Sun, Heart, Star, ArrowRight, MapPin } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { Logo } from "@/components/logo";
import { people, places, currentUser } from "@/lib/mock-data";
import { proximityLabel } from "@/lib/proximity";
import { PresenceDot } from "@/components/presence-dot";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Connexa — Mova-se, conecte-se, descubra" },
      { name: "description", content: "Seu feed contextual de pessoas, eventos e lugares perto de você." },
    ],
  }),
  component: Home,
});

function formatToday() {
  try {
    const s = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch {
    return "";
  }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function Home() {
  const firstName = currentUser.name.split(" ")[0];
  const cafe = places[0];
  const evento = places[1];
  const burger = places[2];
  const interestingPeople = people.slice(0, 3);

  return (
    <div className="flex-1">
      <StatusBar />
      {/* Header */}
      <header className="px-5 pt-1 pb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <Logo size={36} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/notificacoes" className="relative h-10 w-10 grid place-items-center rounded-full bg-secondary" aria-label="Notificações">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-gradient-brand text-[9px] font-bold text-white grid place-items-center">3</span>
          </Link>
          <Link to="/connecta" className="relative h-10 w-10 grid place-items-center rounded-full bg-secondary" aria-label="Mensagens">
            <MessageSquare className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-pink" />
          </Link>
        </div>
      </header>

      {/* Saudação + clima */}
      <section className="px-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold leading-tight truncate">
            {greeting()}, <span className="text-primary">{firstName}!</span> <span aria-hidden>👋</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{formatToday()}</p>
        </div>
        <div className="shrink-0 rounded-2xl bg-surface border border-border px-3 py-2 flex items-center gap-2 shadow-soft">
          <span className="h-8 w-8 grid place-items-center rounded-full bg-accent text-primary">
            <Sun className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-bold">28°C</div>
            <button className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              São Paulo, SP <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section>

      {/* Busca + atalhos */}
      <section className="mt-4 px-5 flex items-center gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-2 rounded-full bg-surface border border-border px-3.5 py-2.5 shadow-soft">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">Para onde vamos hoje?</span>
        </div>
        <button className="shrink-0 h-10 px-3 rounded-full bg-surface border border-border flex items-center gap-1.5 shadow-soft" aria-label="Casa">
          <HomeIcon className="h-4 w-4 text-primary" />
          <span className="text-[11px] font-semibold">Casa</span>
        </button>
        <button className="shrink-0 h-10 w-10 rounded-full bg-surface border border-border grid place-items-center shadow-soft" aria-label="Mais atalhos">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </section>

      {/* Grid de ações rápidas */}
      <section className="mt-5 px-5">
        <div className="grid grid-cols-6 gap-1">
          <Link to="/rota"><QuickAction label="Corrida" Icon={Car} tone="a" /></Link>
          <Link to="/connecta"><QuickAction label="Pessoas" Icon={Users} tone="b" /></Link>
          <Link to="/locais"><QuickAction label="Eventos" Icon={Ticket} tone="c" /></Link>
          <Link to="/locais"><QuickAction label="Promoções" Icon={Tag} tone="d" /></Link>
          <Link to="/locais"><QuickAction label="Locais" Icon={Store} tone="e" /></Link>
          <Link to="/reels"><QuickAction label="Explorar" Icon={Compass} tone="f" /></Link>
        </div>
      </section>

      {/* Cabeçalho do feed */}
      <section className="mt-6 px-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-primary">✨</span>
            <h2 className="font-display text-base font-bold truncate">Pessoas interessantes</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Conteúdos selecionados para você, aqui e agora.</p>
        </div>
        <button className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary">
          Personalizar <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      </section>

      {/* Feed */}
      <div className="mt-3 px-5 space-y-3 pb-2">
        {/* 1. Pessoas interessantes */}
        <div className="rounded-2xl bg-accent/40 border border-primary/20 p-4">
          <div className="flex items-center gap-1.5 text-primary text-[11px] font-semibold">
            <Users className="h-3.5 w-3.5" /> Pessoas interessantes
          </div>
          <div className="mt-1.5 font-display font-bold text-[15px] leading-tight text-primary">
            {interestingPeople.length} pessoas com interesses<br />em comum perto de você
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Música", "Viagens", "Cafés"].map((t) => (
              <span key={t} className="rounded-full bg-surface border border-border text-[11px] font-semibold px-2.5 py-1 flex items-center gap-1">
                {t === "Música" ? "🎵" : t === "Viagens" ? "✈️" : "☕"} {t}
              </span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <div className="flex items-center min-w-0">
              {interestingPeople.map((p, i) => (
                <Link key={p.id} to="/perfil/$id" params={{ id: p.id }} search={{ from: "home" }} className="relative shrink-0" style={{ marginLeft: i === 0 ? 0 : -10 }}>
                  <img src={p.photo} alt={p.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-surface" />
                  <PresenceDot online={p.online} className="absolute -bottom-0.5 -right-0.5" />
                </Link>
              ))}
              <Link to="/connecta" className="ml-1 h-10 w-10 rounded-full border-2 border-dashed border-primary/40 grid place-items-center text-primary shrink-0" aria-label="Ver mais pessoas">
                +
              </Link>
            </div>
            <Link to="/connecta" className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary">
              Ver pessoas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* 2. Motorista */}
        <Link to="/rota" className="block rounded-2xl bg-surface border border-border shadow-soft overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto]">
            <div className="p-4 min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <span className="h-6 w-6 grid place-items-center rounded-full bg-accent"><Car className="h-3.5 w-3.5" /></span>
                Motorista a <span className="text-primary">2 min</span> de você
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">Destino sugerido:</div>
              <div className="font-display font-bold text-sm truncate">Av. Paulista, 1000</div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-lg text-primary">R$ 18,90</span>
                <span className="rounded-full bg-accent text-primary text-[10px] font-semibold px-2 py-0.5">Promoção aplicada</span>
              </div>
            </div>
            <div className="w-24 shrink-0 bg-gradient-brand grid place-items-center">
              <Car className="h-10 w-10 text-white/90" />
            </div>
          </div>
          <div className="mx-3 mb-3 rounded-xl bg-secondary p-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img src="https://i.pravatar.cc/80?img=68" alt="" className="h-8 w-8 rounded-full shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">Carlos <Star className="inline h-3 w-3 fill-current text-primary" /> 4,9</div>
                <div className="text-[10px] text-muted-foreground truncate">Chevrolet Onix · Top motorista</div>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-gradient-brand text-white text-xs font-semibold px-3 py-1.5 shadow-soft">
              Solicitar
            </span>
          </div>
        </Link>

        {/* 3. Promoção */}
        <Link to="/local/$id" params={{ id: cafe.id }} className="block rounded-2xl bg-surface border border-border shadow-soft overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto]">
            <div className="p-4 min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <Tag className="h-3.5 w-3.5" /> Promoção perto de você
              </div>
              <div className="mt-1.5 font-display font-bold text-[15px] leading-tight">
                Café especial com<br /><span className="text-primary text-lg">20% OFF</span>
              </div>
              <div className="mt-2 text-xs font-semibold truncate">{cafe.name}</div>
              <div className="text-[11px] text-muted-foreground">{proximityLabel(cafe.distanceMeters)} de você</div>
              <div className="mt-2 text-[11px] font-semibold text-primary flex items-center gap-1">
                Ver detalhes <ArrowRight className="h-3 w-3" />
              </div>
            </div>
            <div className="relative w-28 shrink-0">
              <img src={cafe.cover} alt={cafe.name} className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute bottom-2 right-2 rounded-lg bg-surface/95 text-primary text-[10px] font-bold px-2 py-1 leading-tight text-center shadow-soft">
                Só hoje!<br /><span className="text-muted-foreground font-medium">até 23:00</span>
              </span>
            </div>
          </div>
        </Link>

        {/* 4. Evento */}
        <Link to="/local/$id" params={{ id: evento.id }} className="block rounded-2xl bg-surface border border-border shadow-soft overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto]">
            <div className="p-4 min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <span className="h-5 w-5 grid place-items-center rounded-full bg-accent"><Star className="h-3 w-3 fill-current" /></span>
                Evento recomendado
              </div>
              <div className="mt-1.5 font-display font-bold text-[15px] leading-tight truncate">{evento.name}</div>
              <div className="text-xs text-muted-foreground truncate">Parque Ibirapuera</div>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Ticket className="h-3 w-3" /> {evento.hours}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {proximityLabel(evento.distanceMeters)}</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex">
                  {people.slice(0, 3).map((p, i) => (
                    <img key={p.id} src={p.photo} alt="" className="h-5 w-5 rounded-full ring-2 ring-surface object-cover" style={{ marginLeft: i === 0 ? 0 : -6 }} />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground truncate">Giulia, Pedro e +32 vão</span>
              </div>
            </div>
            <div className="relative w-28 shrink-0">
              <img src={evento.cover} alt={evento.name} className="absolute inset-0 h-full w-full object-cover" />
              <button className="absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-full bg-surface/95 shadow-soft" aria-label="Favoritar">
                <Heart className="h-3.5 w-3.5 text-primary" />
              </button>
              <span className="absolute bottom-2 right-2 rounded-full bg-surface text-primary text-[11px] font-semibold px-2.5 py-1 shadow-soft">
                Quero ir
              </span>
            </div>
          </div>
        </Link>

        {/* 5. Negócio local */}
        <Link to="/local/$id" params={{ id: burger.id }} className="block rounded-2xl bg-surface border border-border shadow-soft overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto]">
            <div className="p-4 min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                <Store className="h-3.5 w-3.5" /> Negócio local
              </div>
              <div className="mt-1.5 font-display font-bold text-[15px] leading-tight truncate">{burger.name}</div>
              <div className="text-xs">Almoço Executivo com <span className="text-primary font-bold">15% OFF</span></div>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {proximityLabel(burger.distanceMeters)}</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-current text-primary" /> {burger.rating}</span>
              </div>
            </div>
            <div className="relative w-28 shrink-0">
              <img src={burger.cover} alt={burger.name} className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute bottom-2 right-2 rounded-full bg-surface text-primary text-[11px] font-semibold px-2.5 py-1 shadow-soft">
                Ver cardápio
              </span>
            </div>
          </div>
        </Link>
      </div>

      <div className="h-4" />
    </div>
  );
}

const toneMap: Record<string, string> = {
  a: "bg-accent text-primary",
  b: "bg-secondary text-primary",
  c: "bg-accent text-primary",
  d: "bg-secondary text-primary",
  e: "bg-accent text-primary",
  f: "bg-secondary text-primary",
};

function QuickAction({ to, label, Icon, tone }: { to: string; label: string; Icon: React.ComponentType<{ className?: string }>; tone: keyof typeof toneMap }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1.5">
      <span className={`h-12 w-12 grid place-items-center rounded-2xl shadow-soft ${toneMap[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[10px] font-semibold text-center leading-tight">{label}</span>
    </Link>
  );
}
