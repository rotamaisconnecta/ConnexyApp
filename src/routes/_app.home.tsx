import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Building2, ArrowRight, UserRound } from "lucide-react";
import { MessageSquare } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { BrandLogo } from "@/components/ui/brand-logo";
import { HomePremiumFeed } from "@/components/feed/HomePremiumFeed";
import { LocalSponsoredFeed } from "@/components/ads/LocalSponsoredFeed";
import { PresenceLiveFeed } from "@/components/presence/presence-live-feed";
import { ConnexyInviteCard } from "@/components/share/connexy-invite-card";
import { useAuth } from "@/hooks/use-auth";
import { ProfileRepository } from "@/repositories/profile.repository";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { currentUser } from "@/lib/mock-data";
import { getStoredRoles } from "@/lib/roles/roles-storage";
import { UserRole } from "@/lib/roles/roles-types";
import { PromoPopup } from "@/components/promo-popup";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Connexy" },
      {
        name: "description",
        content: "Seu feed contextual de pessoas, eventos e lugares perto de voce.",
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
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

interface ProfileData {
  name: string | null;
  photo_url: string | null;
}

function Home() {
  const { user } = useAuth();
  const configured = isPublicSupabaseConfigured();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    if (!configured || !user) return;
    let cancelled = false;
    ProfileRepository.getProfile(user.id)
      .then((p) => {
        if (!cancelled) setProfile({ name: p.name, photo_url: p.photo_url });
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [configured, user]);

  const displayName = (() => {
    if (profile?.name?.trim()) return profile.name.trim();
    if (user?.user_metadata?.name?.trim()) return user.user_metadata.name.trim();
    return "Olá";
  })();

  const firstName = displayName.split(" ")[0];
  const avatarUrl = profile?.photo_url ?? null;
  const initials = getInitials(displayName);

  useEffect(() => setAvatarFailed(false), [avatarUrl]);

  const stored = getStoredRoles();
  const hasExtraRoles = stored.roles.some((r) => r !== UserRole.USER);

  return (
    <div className="flex-1">
      <StatusBar />

      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 pt-1 pb-3">
        <div />
        <div className="flex flex-col items-center">
          <BrandLogo variant="full" size="lg" />
          <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
            Seu ecossistema digital
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 justify-end pr-12">
          <Link
            to="/chat"
            className="relative h-10 w-10 grid place-items-center rounded-full bg-secondary"
            aria-label="Conversas"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-pink" />
          </Link>
          <Link
            to="/notificacoes"
            className="relative h-10 w-10 grid place-items-center rounded-full bg-secondary"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="px-5">
        <div className="flex items-center gap-3">
          <Link
            to="/perfil"
            aria-label="Abrir meu perfil"
            className="shrink-0 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {avatarUrl && !avatarFailed ? (
              <img
                src={avatarUrl}
                alt={`Foto de ${displayName}`}
                onError={() => setAvatarFailed(true)}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-soft"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-white ring-2 ring-white shadow-soft">
                {initials ? (
                  <span className="text-sm font-bold">{initials}</span>
                ) : (
                  <UserRound className="h-5 w-5" />
                )}
              </div>
            )}
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight">
              {greeting()}, <span className="text-primary">{firstName}!</span>{" "}
              <span aria-hidden>👋</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{formatToday()}</p>
          </div>
        </div>
      </section>

      {!hasExtraRoles && (
        <section className="mx-5 mt-4">
          <Link
            to="/my-connexy"
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-surface shadow-soft hover:shadow-elevated transition-all active:scale-[0.98]"
          >
            <span className="h-11 w-11 grid place-items-center rounded-xl bg-gradient-brand text-white shadow-floating">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <div className="text-sm font-bold">🚀 Meu Connexy</div>
              <div className="text-[11px] text-muted-foreground">
                Crie seu negócio, publique ofertas e muito mais
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>
      )}

      <div className="mt-5">
        <HomePremiumFeed />
      </div>

      <PromoPopup />

      <div className="mt-5">
        <LocalSponsoredFeed />
      </div>

      <div className="mt-5">
        <PresenceLiveFeed />
      </div>

      <section className="mt-5 px-5 pb-6">
        <ConnexyInviteCard />
      </section>
    </div>
  );
}
