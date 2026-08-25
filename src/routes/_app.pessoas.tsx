import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { PremiumCardView } from "@/components/feed/cards/premium-card";
import { buildFullPeopleCards } from "@/lib/feed/home-premium";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { useDiscovery } from "@/hooks/api/use-discovery";
import { formatPersonDistance } from "@/lib/proximity";
import { ConversationInviteButton } from "@/components/chat/conversation-invite-button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/pessoas")({
  head: () => ({ meta: [{ title: "Pessoas — Connexy" }] }),
  component: Pessoas,
});

function Pessoas() {
  const configured = isPublicSupabaseConfigured();
  const { people: nearbyProfiles, isLoading, error, refresh } = useDiscovery();

  if (configured) {
    return (
      <div className="flex-1">
        <StatusBar />
        <header className="px-5 pt-1 pb-3 flex items-center gap-3">
          <BackButton
            fallbackTo="/home"
            className="h-10 w-10 grid place-items-center rounded-full bg-secondary"
            ariaLabel="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </BackButton>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold">👥 Pessoas Próximas</h1>
            <p className="text-[11px] text-muted-foreground">
              {isLoading
                ? "Carregando..."
                : error
                  ? "Erro ao carregar"
                  : `${nearbyProfiles.length} pessoas por perto de você`}
            </p>
          </div>
        </header>

        <div className="px-4 pb-6">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-[20px] border border-border/50 bg-surface overflow-hidden"
                >
                  <div className="h-32 bg-muted animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-16 rounded-full bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-xs text-muted-foreground">
                Não foi possível carregar pessoas próximas.
              </p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <RefreshCw className="h-3 w-3" /> Tentar novamente
              </button>
            </div>
          ) : nearbyProfiles.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs text-muted-foreground">
                Nenhuma pessoa nova nas proximidades agora.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {nearbyProfiles.map((p) => {
                const distanceMeters = (p.distance_km ?? 0) * 1000;
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-surface border border-border p-3 shadow-soft flex items-center gap-3"
                  >
                    <Link
                      to="/perfil/$id"
                      params={{ id: p.id }}
                      search={{ from: "connecta" }}
                      className="relative shrink-0"
                      aria-label={`Ver perfil de ${p.name}`}
                    >
                      {p.photo_url ? (
                        <img
                          src={p.photo_url}
                          alt={p.name}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">
                        {p.name}
                        {p.age ? `, ${p.age}` : ""}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-accent text-primary">
                          {formatPersonDistance(distanceMeters)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.common_interests.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-accent text-primary text-[10px] font-semibold px-2 py-0.5"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ConversationInviteButton
                      personId={p.id}
                      personName={p.name}
                      variant="compact"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const cards = buildFullPeopleCards();

  return (
    <div className="flex-1">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <BackButton
          fallbackTo="/home"
          className="h-10 w-10 grid place-items-center rounded-full bg-secondary"
          ariaLabel="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </BackButton>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold">👥 Pessoas Próximas</h1>
          <p className="text-[11px] text-muted-foreground">
            {cards.length} pessoas por perto de você
          </p>
        </div>
      </header>

      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <PremiumCardView key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
