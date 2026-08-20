import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBar } from "@/components/phone-frame";
import { Hero } from "@/components/profile/atoms/hero";
import { ConfirmDialog } from "@/components/system/confirm-dialog";
import { signOut } from "@/lib/auth/sign-out";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { toast } from "sonner";

import { currentUser, findPlace } from "@/lib/mock-data";
import {
  MapPin,
  Star,
  Settings,
  ChevronRight,
  Users,
  Handshake,
  CalendarCheck,
  Shield,
  MoreVertical,
  LogOut,
  Loader2,
  Heart,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { sectionFade } from "@/components/profile/animations";
import ModeSwitcher from "@/components/roles/ModeSwitcher";
import { ConnexyInviteCard } from "@/components/share/connexy-invite-card";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [{ title: "Meu Perfil — Connexy" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const nav = useNavigate();
  const favPlaces = (currentUser.favoritePlaceIds ?? []).map(findPlace).filter(Boolean);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function doSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      if (isPublicSupabaseConfigured()) await signOut();
      toast.success("Você saiu da sua conta.");
      nav({ to: "/auth", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível sair da conta.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex-1">
      <StatusBar />

      <header className="pl-5 pr-16 pt-1 pb-3 flex items-center justify-between">
        <h1 className="font-display font-bold text-lg">Meu Perfil</h1>
        <div className="relative">
          <button
            type="button"
            aria-label="Opções do perfil"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground hover:bg-accent transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-border bg-surface p-1.5 shadow-elevated">
                <Link
                  to="/gerenciar"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Editar perfil
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}

      <div className="px-4">
        <Hero
          photo={currentUser.photo}
          name={currentUser.name}
          handle={`@${currentUser.handle}`}
          subtitle={currentUser.city}
          online
          photoVariant="pessoa"
          gradientBg
        />
      </div>

      <ModeSwitcher />

      {/* ── Bio ──────────────────────────────────────────── */}

      {currentUser.bio && (
        <motion.p
          variants={sectionFade(1.5)}
          initial="hidden"
          animate="visible"
          className="mx-4 mt-2 text-sm text-muted-foreground text-center leading-relaxed"
        >
          {currentUser.bio}
        </motion.p>
      )}

      {/* ── Favorite Places ───────────────────────────────── */}

      {favPlaces.length > 0 && (
        <motion.section
          variants={sectionFade(2)}
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

      {/* ── Conexões ──────────────────────────────────────── */}

      <motion.section
        variants={sectionFade(2.5)}
        initial="hidden"
        animate="visible"
        className="mx-4 mt-3 rounded-3xl border border-border bg-surface p-4 shadow-soft"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 grid place-items-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-bold">{currentUser.connections}</div>
              <div className="text-[11px] text-muted-foreground">Conexões</div>
            </div>
          </div>
          <Link to="/connecta" className="text-[11px] font-semibold text-primary hover:underline">
            Ver todas
          </Link>
        </div>
      </motion.section>

      {/* ── Encontros ─────────────────────────────────────── */}

      <motion.section
        variants={sectionFade(3)}
        initial="hidden"
        animate="visible"
        className="mx-4 mt-3 rounded-3xl border border-border bg-surface p-4 shadow-soft"
      >
        <div className="flex items-center gap-2">
          <span className="h-9 w-9 grid place-items-center rounded-xl bg-primary/10 text-primary">
            <Handshake className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-bold">{currentUser.trips}</div>
            <div className="text-[11px] text-muted-foreground">Encontros</div>
          </div>
        </div>
      </motion.section>

      {/* ── Membro desde ──────────────────────────────────── */}

      <motion.section
        variants={sectionFade(3.5)}
        initial="hidden"
        animate="visible"
        className="mx-4 mt-3 rounded-3xl border border-border bg-surface p-4 shadow-soft"
      >
        <div className="flex items-center gap-2">
          <span className="h-9 w-9 grid place-items-center rounded-xl bg-primary/10 text-primary">
            <CalendarCheck className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-bold">Membro desde</div>
            <div className="text-[11px] text-muted-foreground">
              {/* real date would come from Supabase profiles.created_at */}
              Connexy
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Momentos ──────────────────────────────────────── */}

      <motion.section
        variants={sectionFade(4)}
        initial="hidden"
        animate="visible"
        className="mx-4 mt-3 rounded-3xl border border-border bg-surface p-4 shadow-soft"
      >
        <div className="flex items-center gap-2">
          <span className="h-9 w-9 grid place-items-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-bold">Momentos</div>
            <div className="text-[11px] text-muted-foreground">
              {/* moments would come from bio_posts when connected to Supabase */}
              Seus momentos aparecerão aqui
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Postagens ─────────────────────────────────────── */}

      <motion.section
        variants={sectionFade(4.5)}
        initial="hidden"
        animate="visible"
        className="mx-4 mt-3 rounded-3xl border border-border bg-surface p-4 shadow-soft"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 grid place-items-center rounded-xl bg-primary/10 text-primary">
              <Heart className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-bold">Postagens</div>
              <div className="text-[11px] text-muted-foreground">
                {/* post count would come from bio_posts when connected to Supabase */}0 publicações
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Interests ─────────────────────────────────────── */}

      {currentUser.interests.length > 0 && (
        <motion.section
          variants={sectionFade(5)}
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
          variants={sectionFade(5.5)}
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

      {/* ── Meu Connexy ────────────────────────── */}

      <motion.section
        variants={sectionFade(6.3)}
        initial="hidden"
        animate="visible"
        className="mx-4 mt-4"
      >
        <Link
          to="/my-connexy"
          className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-surface shadow-soft hover:shadow-elevated transition-shadow"
        >
          <span className="h-11 w-11 grid place-items-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-bold">Meu Connexy</div>
            <div className="text-[11px] text-muted-foreground">
              Seu centro de gerenciamento completo
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </motion.section>

      {/* ── Convidar ──────────────────────────────────────── */}

      <motion.section
        variants={sectionFade(6.5)}
        initial="hidden"
        animate="visible"
        className="mx-4 mt-4"
      >
        <ConnexyInviteCard compact />
      </motion.section>

      {/* ── Sair ──────────────────────────────────────────── */}

      <motion.section
        variants={sectionFade(7)}
        initial="hidden"
        animate="visible"
        className="mx-4 mt-6 mb-4"
      >
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={signingOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Sair da conta
        </button>
      </motion.section>

      <div className="h-4" />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doSignOut}
        title="Sair da conta"
        message="Tem certeza de que deseja sair? Você precisará entrar novamente para continuar."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        danger
      />
    </div>
  );
}
