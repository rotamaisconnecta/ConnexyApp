import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, MessageSquare, UserRound } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { BrandLogo } from "@/components/ui/brand-logo";
import { HomePremiumFeed } from "@/components/feed/HomePremiumFeed";
import { LocalSponsoredFeed } from "@/components/ads/LocalSponsoredFeed";
import { useAuth } from "@/hooks/use-auth";
import { ProfileRepository } from "@/repositories/profile.repository";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { PromoPopup } from "@/components/promo-popup";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Connexy" },
      {
        name: "description",
        content: "Pessoas, lugares e experiências perto de você.",
      },
    ],
  }),
  component: Home,
});

function formatToday() {
  try {
    const value = new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    return value.charAt(0).toUpperCase() + value.slice(1);
  } catch {
    return "";
  }
}

function greeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
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
      .then((result) => {
        if (!cancelled) setProfile({ name: result.name, photo_url: result.photo_url });
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

  return (
    <div className="flex-1 bg-background">
      <StatusBar />

      <header className="flex items-center justify-between px-5 pb-2 pt-3 md:pt-1">
        <BrandLogo variant="full" size="md" />
        <div className="flex items-center gap-2">
          <Link
            to="/chat"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-border/40 bg-surface/75 shadow-soft backdrop-blur-xl transition-transform active:scale-95"
            aria-label="Conversas"
          >
            <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.9} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pink ring-2 ring-background" />
          </Link>
          <Link
            to="/notificacoes"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-border/40 bg-surface/75 shadow-soft backdrop-blur-xl transition-transform active:scale-95"
            aria-label="Notificações"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </Link>
        </div>
      </header>

      <section className="px-5 pb-1 pt-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">{formatToday()}</p>
            <h1 className="mt-1 font-display text-[28px] font-bold leading-[1.08] tracking-[-0.025em]">
              {greeting()}, {firstName}.
            </h1>
            <p className="mt-2 max-w-[270px] text-sm leading-relaxed text-muted-foreground">
              Descubra quem e o que combina com o seu momento.
            </p>
          </div>

          <Link
            to="/perfil"
            aria-label="Abrir meu perfil"
            className="shrink-0 rounded-full transition-transform active:scale-95"
          >
            {avatarUrl && !avatarFailed ? (
              <img
                src={avatarUrl}
                alt={`Foto de ${displayName}`}
                onError={() => setAvatarFailed(true)}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-background shadow-elevated"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-white ring-2 ring-background shadow-elevated">
                {initials ? (
                  <span className="text-sm font-bold">{initials}</span>
                ) : (
                  <UserRound className="h-5 w-5" />
                )}
              </div>
            )}
          </Link>
        </div>
      </section>

      <div className="mt-8">
        <HomePremiumFeed />
      </div>

      <div className="mt-8 pb-7">
        <LocalSponsoredFeed />
      </div>

      <PromoPopup />
    </div>
  );
}
