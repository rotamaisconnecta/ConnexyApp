import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  MessageSquare,
  Search,
  MapPin,
  Ticket,
  Tag,
  Store,
  Car,
  Star,
  Heart,
  ArrowRight,
  EyeOff,
} from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { Logo } from "@/components/logo";
import { PresenceDot } from "@/components/presence-dot";
import { MapCanvas } from "@/components/map-canvas";
import { PersonDetailSheet } from "@/components/person-detail-sheet";
import {
  people,
  places,
  drivers,
  currentUser,
  compatibilityScore,
  compatibilityInfo,
  interestEmoji,
  type Person,
} from "@/lib/mock-data";
import { proximityLabel, homeProximityLabel } from "@/lib/proximity";
import { useState, useMemo, useCallback } from "react";
import { motion, type Variants, type Easing } from "framer-motion";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Connexa — Mova-se, conecte-se, descubra" },
      {
        name: "description",
        content: "Seu feed contextual de pessoas, eventos e lugares perto de você.",
      },
    ],
  }),
  component: Home,
});

function formatToday() {
  try {
    const s = new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
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

const sectionFade: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as Easing },
  }),
};

const heroFade: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.12, duration: 0.5, ease: "easeOut" as Easing },
  },
};

const MAP_PINS = [
  { kind: "user" as const, x: 50, y: 50, label: "Você" },
  { kind: "person" as const, x: 42, y: 44, label: "Ana" },
  { kind: "person" as const, x: 58, y: 55, label: "Pedro" },
  { kind: "person" as const, x: 48, y: 38, label: "Giulia" },
  { kind: "event" as const, x: 55, y: 42, label: "Feira Gastronômica" },
  { kind: "place" as const, x: 38, y: 52, label: "Café da Vila" },
  { kind: "place" as const, x: 62, y: 58, label: "Burger House" },
  { kind: "driver" as const, x: 45, y: 60, label: "Carlos" },
];

const MAP_LEGEND = [
  { color: "var(--primary)", label: "Você" },
  { color: "oklch(0.72 0.2 355)", label: "Pessoas" },
  { color: "oklch(0.72 0.19 40)", label: "Eventos" },
  { color: "oklch(0.6 0.22 300)", label: "Locais" },
  { color: "#111", label: "Motoristas" },
];

function Home() {
  const firstName = currentUser.name.split(" ")[0];
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [personSheetOpen, setPersonSheetOpen] = useState(false);

  const nearbyPeople = useMemo(() => people.slice(0, 5), []);
  const onlinePeople = useMemo(() => people.filter((p) => p.online), []);
  const eventPlaces = useMemo(
    () => places.filter((p) => p.category === "Eventos").slice(0, 3),
    [],
  );
  const driver = drivers[0];
  const cafe = useMemo(
    () => places.find((p) => p.category === "Cafés") ?? places[0],
    [],
  );
  const burger = useMemo(
    () => places.find((p) => p.category === "Restaurantes") ?? places[2],
    [],
  );

  const openPerson = useCallback((p: Person) => {
    setSelectedPerson(p);
    setPersonSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => setPersonSheetOpen(false), []);

  return (
    <div className="flex-1">
      <StatusBar />

      <header className="px-5 pt-1 pb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <Logo size={36} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/notificacoes"
            className="relative h-10 w-10 grid place-items-center rounded-full bg-secondary"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-gradient-brand text-[9px] font-bold text-white grid place-items-center">
              3
            </span>
          </Link>
          <Link
            to="/connecta"
            className="relative h-10 w-10 grid place-items-center rounded-full bg-secondary"
            aria-label="Mensagens"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-pink" />
          </Link>
        </div>
      </header>

      <section className="px-5">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.photo}
            alt=""
            className="h-12 w-12 rounded-full object-cover shrink-0"
          />
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight">
              {greeting()}, <span className="text-primary">{firstName}!</span>{" "}
              <span aria-hidden>👋</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatToday()}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-4 px-5">
        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-2xl bg-accent/40 border border-accent px-4 py-3.5 shadow-soft transition-all duration-200 hover:bg-accent/60 active:scale-[0.98]"
        >
          <span className="h-8 w-8 grid place-items-center rounded-full bg-primary/10 shrink-0">
            <Search className="h-4 w-4 text-primary" />
          </span>
          <span className="text-sm text-muted-foreground">O que você procura agora?</span>
        </button>
      </section>

      <div className="mt-5 space-y-5 pb-6">
        <motion.section
          custom={0}
          initial="hidden"
          animate="visible"
          variants={heroFade}
          className="px-5"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none" aria-hidden>❤️</span>
                <h2 className="font-display text-lg font-bold truncate">
                  Pessoas Próximas
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Conheça pessoas que compartilham seus interesses.
              </p>
            </div>
            <Link
              to="/connecta"
              className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {nearbyPeople.map((p) => (
              <PersonCard key={p.id} person={p} onOpen={openPerson} />
            ))}
          </div>

          {onlinePeople.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <EyeOff className="h-3 w-3" /> Existem pessoas próximas, mas algumas
                escolheram não aparecer.
              </span>
            </div>
          )}
        </motion.section>

        <motion.section
          custom={1}
          initial="hidden"
          animate="visible"
          variants={sectionFade}
          className="px-5"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <h2 className="font-display text-base font-bold truncate">
                  Mapa ao Vivo
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                O que está acontecendo perto de você
              </p>
            </div>
          </div>

          <div className="h-44 rounded-2xl overflow-hidden shadow-soft">
            <MapCanvas pins={MAP_PINS} className="w-full h-full" />
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {MAP_LEGEND.map((item) => (
              <span
                key={item.label}
                className="flex items-center gap-1 text-[10px] text-muted-foreground"
              >
                <span
                  className="h-2 w-2 rounded-full inline-block"
                  style={{ background: item.color }}
                />{" "}
                {item.label}
              </span>
            ))}
          </div>
        </motion.section>

        <motion.section
          custom={2}
          initial="hidden"
          animate="visible"
          variants={sectionFade}
          className="px-5"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5 text-primary" />
                <h2 className="font-display text-base font-bold truncate">
                  Eventos
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Acontecendo agora na sua região
              </p>
            </div>
            <Link
              to="/locais"
              className="shrink-0 text-xs font-semibold text-primary flex items-center gap-0.5"
            >
              Ver mais <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {eventPlaces.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        </motion.section>

        <motion.section
          custom={3}
          initial="hidden"
          animate="visible"
          variants={sectionFade}
          className="px-5"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-primary" />
                <h2 className="font-display text-base font-bold truncate">
                  Lugares & Promoções
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ofertas imperdíveis perto de você
              </p>
            </div>
          </div>

          <Link
            to="/local/$id"
            params={{ id: cafe.id }}
            className="block rounded-2xl bg-surface border border-border shadow-soft overflow-hidden mb-2.5 transition-all duration-200 hover:shadow-elegant active:scale-[0.99]"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto]">
              <div className="p-4 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                  <Tag className="h-3.5 w-3.5" /> Promoção perto de você
                </div>
                <div className="mt-1.5 font-display font-bold text-[15px] leading-tight">
                  Café especial com
                  <br />
                  <span className="text-primary text-lg">20% OFF</span>
                </div>
                <div className="mt-2 text-xs font-semibold truncate">
                  {cafe.name}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {proximityLabel(cafe.distanceMeters)}
                </div>
                <div className="mt-2 text-[11px] font-semibold text-primary flex items-center gap-1">
                  Ver detalhes <ArrowRight className="h-3 w-3" />
                </div>
              </div>
              <div className="relative w-28 shrink-0">
                <img
                  src={cafe.cover}
                  alt={cafe.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute bottom-2 right-2 rounded-lg bg-surface/95 text-primary text-[10px] font-bold px-2 py-1 leading-tight text-center shadow-soft">
                  Só hoje!
                  <br />
                  <span className="text-muted-foreground font-medium">
                    até 23:00
                  </span>
                </span>
              </div>
            </div>
          </Link>

          <Link
            to="/local/$id"
            params={{ id: burger.id }}
            className="block rounded-2xl bg-surface border border-border shadow-soft overflow-hidden transition-all duration-200 hover:shadow-elegant active:scale-[0.99]"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto]">
              <div className="p-4 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                  <Store className="h-3.5 w-3.5" /> Negócio local
                </div>
                <div className="mt-1.5 font-display font-bold text-[15px] leading-tight truncate">
                  {burger.name}
                </div>
                <div className="text-xs">
                  Almoço Executivo com{" "}
                  <span className="text-primary font-bold">15% OFF</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{" "}
                    {proximityLabel(burger.distanceMeters)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-primary" />{" "}
                    {burger.rating}
                  </span>
                </div>
              </div>
              <div className="relative w-28 shrink-0">
                <img
                  src={burger.cover}
                  alt={burger.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute bottom-2 right-2 rounded-full bg-surface text-primary text-[11px] font-semibold px-2.5 py-1 shadow-soft">
                  Ver cardápio
                </span>
              </div>
            </div>
          </Link>
        </motion.section>

        <motion.section
          custom={4}
          initial="hidden"
          animate="visible"
          variants={sectionFade}
          className="px-5"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-primary" />
                <h2 className="font-display text-base font-bold truncate">
                  Mobilidade
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Motoristas disponíveis agora
              </p>
            </div>
          </div>

          <Link
            to="/rota"
            className="block rounded-2xl bg-surface border border-border shadow-soft overflow-hidden p-4 transition-all duration-200 hover:shadow-elegant active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Car className="h-3.5 w-3.5 text-primary" />
                  Motorista a{" "}
                  <span className="text-primary font-semibold">2 min</span>
                </div>
                <div className="mt-1 font-display font-bold text-sm">
                  Av. Paulista, 1000
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-display font-bold text-lg text-primary">
                    R$ 18,90
                  </span>
                  <span className="rounded-full bg-accent text-primary text-[10px] font-semibold px-2 py-0.5">
                    Promoção aplicada
                  </span>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-gradient-brand text-white text-xs font-semibold px-4 py-2.5 shadow-soft">
                Solicitar
              </span>
            </div>
            {driver && (
              <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border">
                <img
                  src={driver.photo}
                  alt={driver.name}
                  loading="lazy"
                  className="h-8 w-8 rounded-full shrink-0 object-cover"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">
                    {driver.name}{" "}
                    <Star className="inline h-3 w-3 fill-current text-primary" />{" "}
                    {driver.rating}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {driver.car} · {driver.plate}
                  </div>
                </div>
              </div>
            )}
          </Link>
        </motion.section>
      </div>

      <PersonDetailSheet
        person={selectedPerson}
        open={personSheetOpen}
        onClose={closeSheet}
      />
    </div>
  );
}

function PersonCard({
  person,
  onOpen,
}: {
  person: Person;
  onOpen: (p: Person) => void;
}) {
  const score = useMemo(() => compatibilityScore(person), [person]);
  const tier = useMemo(() => compatibilityInfo(score), [score]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Ver perfil de ${person.name}, ${person.age} anos`}
      onClick={() => onOpen(person)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(person);
        }
      }}
      className="shrink-0 w-52 rounded-2xl bg-surface border border-border shadow-soft overflow-hidden text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200 hover:shadow-elegant hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="relative h-52">
        <img
          src={person.photo}
          alt={person.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {tier && (
          <span
            className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${tier.className}`}
          >
            {score}%
          </span>
        )}
        <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface/90 text-foreground shadow-soft">
          {homeProximityLabel(person.distanceMeters)}
        </span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5">
          <span className="font-display font-bold text-sm truncate">
            {person.name}, {person.age}
          </span>
          <PresenceDot online={person.online} size={8} />
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {person.interests.slice(0, 3).map((interest) => (
            <span
              key={interest}
              className="text-[9px] bg-secondary rounded-full px-1.5 py-0.5"
            >
              {interestEmoji[interest] ?? "•"} {interest}
            </span>
          ))}
        </div>
        <span
          aria-hidden
          className="mt-2.5 block w-full h-9 rounded-xl bg-gradient-brand text-white text-xs font-semibold shadow-soft items-center justify-center"
        >
          Conhecer
        </span>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: (typeof places)[number] }) {
  const attendees = useMemo(() => people.slice(0, 2), []);

  return (
    <Link
      to="/local/$id"
      params={{ id: event.id }}
      className="shrink-0 w-44 rounded-2xl bg-surface border border-border shadow-soft overflow-hidden transition-all duration-200 hover:shadow-elegant active:scale-[0.98]"
    >
      <div className="relative h-32">
        <img
          src={event.cover}
          alt={event.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <span
          role="button"
          tabIndex={0}
          aria-label="Favoritar"
          onClick={(e) => e.preventDefault()}
          onKeyDown={(e) => e.preventDefault()}
          className="absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-full bg-surface/90 shadow-soft cursor-pointer"
        >
          <Heart className="h-3.5 w-3.5 text-primary" />
        </span>
        <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface/90 text-primary shadow-soft">
          Quero ir
        </span>
      </div>
      <div className="p-3">
        <div className="font-display font-bold text-sm truncate">
          {event.name}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {proximityLabel(event.distanceMeters)}
          </span>
        </div>
        {event.hours && (
          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Ticket className="h-3 w-3 shrink-0" /> {event.hours}
          </div>
        )}
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex">
            {attendees.map((p, i) => (
              <img
                key={p.id}
                src={p.photo}
                alt={p.name}
                loading="lazy"
                className={`h-4 w-4 rounded-full ring-1 ring-surface object-cover ${i > 0 ? "-ml-[5px]" : ""}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">+32 vão</span>
        </div>
      </div>
    </Link>
  );
}
