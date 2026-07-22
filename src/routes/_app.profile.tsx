import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { Hero } from "@/components/profile/atoms/hero";
import { Moment } from "@/components/profile/atoms/moment";
import { Badge } from "@/components/ui/badge";
import { currentUser, findPlace, places } from "@/lib/mock-data";
import { type MomentData } from "@/lib/profile/moment-expiry";
import {
  MapPin,
  Star,
  Settings,
  ChevronRight,
  Users,
  Handshake,
  CalendarCheck,
  Car,
} from "lucide-react";
import { motion } from "framer-motion";
import { sectionFade } from "@/components/profile/animations";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [{ title: "Meu Perfil — Connexy" }],
  }),
  component: ProfilePage,
});

const MOCK_MOMENT: MomentData = {
  id: "self-1",
  text: "Café da manhã no Central antes do trabalho ☕",
  createdAt: new Date(Date.now() - 45 * 60 * 1000),
  active: true,
  place: { name: "Café Central" },
};

function ProfilePage() {
  const favPlaces = (currentUser.favoritePlaceIds ?? []).map(findPlace).filter(Boolean);

  return (
    <div className="flex-1 pb-20">
      <StatusBar />

      <header className="px-5 pt-1 pb-3 flex items-center justify-between">
        <h1 className="font-display font-bold text-lg">Meu Perfil</h1>
        <Link to="/gerenciar" className="text-xs font-semibold text-primary">
          Editar
        </Link>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}

      <div className="px-4">
        <Hero
          photo={currentUser.photo}
          name={currentUser.name}
          handle={`@${currentUser.handle}`}
          subtitle="Conectando perto de você"
          online
          photoVariant="pessoa"
          gradientBg
          badge={<Badge>Ver perfil público</Badge>}
          mood={{ emoji: "🎧", text: "explorando o Connexy" }}
        />
      </div>

      {/* ── Moment ────────────────────────────────────────── */}

      <div className="px-4 mt-3">
        <Moment
          moment={MOCK_MOMENT}
          variant="full"
          profileName={currentUser.name}
          onPlaceClick={(name) => {
            const match = places.find((p) => p.name === name);
            if (match) window.location.href = `/local/${match.id}`;
          }}
        />
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}

      <motion.section
        variants={sectionFade(2)}
        initial="hidden"
        animate="visible"
        className="mx-4 mt-3 rounded-3xl border border-border bg-surface p-3 flex items-center justify-around text-center shadow-soft"
      >
        <Stat icon={Star} value={currentUser.rating} label="Avaliação" />
        <div className="h-8 w-px bg-border" />
        <Stat icon={Handshake} value={currentUser.trips} label="Corridas" />
        <div className="h-8 w-px bg-border" />
        <Stat icon={Users} value={currentUser.connections} label="Conexões" />
      </motion.section>

      {/* ── Interests ─────────────────────────────────────── */}

      {currentUser.interests.length > 0 && (
        <motion.section
          variants={sectionFade(3)}
          initial="hidden"
          animate="visible"
          className="mx-4 mt-3 rounded-3xl border border-border bg-surface p-4 shadow-soft"
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Interesses
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {currentUser.interests.map((t) => (
              <span
                key={t}
                className="rounded-full bg-accent text-primary text-[11px] font-semibold px-2.5 py-1"
              >
                {t}
              </span>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Vibe Tags ─────────────────────────────────────── */}

      {currentUser.vibeTags && currentUser.vibeTags.length > 0 && (
        <motion.section
          variants={sectionFade(4)}
          initial="hidden"
          animate="visible"
          className="mx-4 mt-3 rounded-3xl border border-border bg-surface p-4 shadow-soft"
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Vibe
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {currentUser.vibeTags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-surface text-foreground border border-border text-[11px] font-semibold px-2.5 py-1"
              >
                ✦ {t}
              </span>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Favorite Places ───────────────────────────────── */}

      {favPlaces.length > 0 && (
        <motion.section
          variants={sectionFade(5)}
          initial="hidden"
          animate="visible"
          className="mt-4"
        >
          <div className="px-4 flex items-center justify-between mb-2">
            <h2 className="font-display font-bold text-sm">Locais favoritos</h2>
            <span className="text-[11px] text-muted-foreground">{favPlaces.length}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {favPlaces.map(
              (pl) =>
                pl && (
                  <Link
                    key={pl.id}
                    to="/local/$id"
                    params={{ id: pl.id }}
                    className="shrink-0 w-40 rounded-2xl bg-surface border border-border overflow-hidden shadow-soft"
                  >
                    <img src={pl.cover} alt={pl.name} className="h-20 w-full object-cover" />
                    <div className="p-2">
                      <div className="text-[10px] uppercase font-semibold text-primary">
                        {pl.category}
                      </div>
                      <div className="font-semibold text-xs truncate">{pl.name}</div>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" />
                        {pl.distanceMeters < 1000
                          ? `${pl.distanceMeters}m`
                          : `${(pl.distanceMeters / 1000).toFixed(1)}km`}
                      </div>
                    </div>
                  </Link>
                ),
            )}
          </div>
        </motion.section>
      )}

      {/* ── Mobilidade ────────────────────────────────────── */}

      <motion.section
        variants={sectionFade(5.5)}
        initial="hidden"
        animate="visible"
        className="mx-4 mt-3 rounded-3xl border border-border bg-surface p-4 shadow-soft"
      >
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 grid place-items-center rounded-xl bg-accent text-primary">
            <Car className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Mobilidade</div>
            <div className="text-[11px] text-muted-foreground">
              Cadastre-se para receber solicitações de corrida
            </div>
          </div>
        </div>
        <Link
          to="/profile/driver"
          className="mt-3 block w-full rounded-xl bg-gradient-brand py-2.5 text-center text-xs font-semibold text-white shadow-soft"
        >
          Tornar-me motorista
        </Link>
      </motion.section>

      {/* ── Quick Links ───────────────────────────────────── */}

      <motion.section
        variants={sectionFade(6)}
        initial="hidden"
        animate="visible"
        className="mx-4 mt-4 rounded-2xl bg-surface border border-border divide-y divide-border"
      >
        <Link to="/gerenciar" className="flex items-center gap-3 px-4 py-3">
          <span className="h-9 w-9 grid place-items-center rounded-xl bg-accent text-primary">
            <Settings className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Gerenciar minha bio</div>
            <div className="text-[11px] text-muted-foreground">
              Edite bio, posts, humor e interesses
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/privacidade" className="flex items-center gap-3 px-4 py-3">
          <span className="h-9 w-9 grid place-items-center rounded-xl bg-accent text-primary">
            <CalendarCheck className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Minhas viagens</div>
            <div className="text-[11px] text-muted-foreground">Histórico e avaliações</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </motion.section>

      <div className="h-6" />
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <Icon className="h-4 w-4 text-primary" />
      <div className="text-sm font-bold mt-0.5">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
