import { useState, useMemo, useRef, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  MessageSquare,
  Search,
  X,
  Users,
  Building2,
  Calendar,
  MapPin,
  Tag,
  Film,
  Car,
  ArrowRight,
} from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SmartFeed } from "@/components/feed/SmartFeed";
import { currentUser, people, places } from "@/lib/mock-data";
import { drivers } from "@/lib/mock-data";

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
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

type SearchResult = {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  route: string;
  type: "pessoa" | "empresa" | "evento" | "local" | "oferta" | "reel" | "carona";
};

function Home() {
  const navigate = useNavigate();
  const firstName = currentUser.name.split(" ")[0];
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    people
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.interests || []).some((i) => i.toLowerCase().includes(q)),
      )
      .forEach((p) => {
        results.push({
          id: p.id,
          label: p.name,
          subtitle: `${p.distanceMeters < 1000 ? `${p.distanceMeters}m` : `${(p.distanceMeters / 1000).toFixed(1)}km`} • ${p.interests.slice(0, 2).join(", ")}`,
          icon: "👤",
          route: `/perfil/${p.id}`,
          type: "pessoa",
        });
      });

    places
      .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .forEach((p) => {
        results.push({
          id: p.id,
          label: p.name,
          subtitle: `${p.category} • ${p.distanceMeters < 1000 ? `${p.distanceMeters}m` : `${(p.distanceMeters / 1000).toFixed(1)}km`}`,
          icon:
            p.category === "Restaurantes"
              ? "🍽️"
              : p.category === "Cafés"
                ? "☕"
                : p.category === "Eventos"
                  ? "🎉"
                  : "🛍️",
          route: `/local/${p.id}`,
          type: "local",
        });
      });

    drivers
      .filter((d) => d.name.toLowerCase().includes(q))
      .forEach((d) => {
        results.push({
          id: d.id,
          label: d.name,
          subtitle: `${d.car} • ${d.distanceMeters < 1000 ? `${d.distanceMeters}m` : `${(d.distanceMeters / 1000).toFixed(1)}km`}`,
          icon: "🚗",
          route: "/ride/request",
          type: "carona",
        });
      });

    return results;
  }, [searchQuery]);

  const searchCategories = [
    { label: "Pessoas", icon: "👤", type: "pessoa" as const },
    { label: "Empresas", icon: "🏢", type: "empresa" as const },
    { label: "Eventos", icon: "🎉", type: "evento" as const },
    { label: "Locais", icon: "📍", type: "local" as const },
    { label: "Ofertas", icon: "🏷️", type: "oferta" as const },
    { label: "Reels", icon: "▶️", type: "reel" as const },
    { label: "Caronas", icon: "🚗", type: "carona" as const },
  ];

  return (
    <div className="flex-1">
      <StatusBar />

      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 pt-1 pb-3">
        <div />
        <BrandLogo variant="full" size="lg" />
        <div className="flex items-center gap-2 shrink-0 justify-end">
          <Link
            to="/notificacoes"
            className="relative h-10 w-10 grid place-items-center rounded-full bg-secondary"
            aria-label="Notificacoes"
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
          <Link
            to="/perfil"
            aria-label="Abrir meu perfil"
            className="shrink-0 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <img
              src={currentUser.photo}
              alt={`Foto de ${currentUser.name}`}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-soft"
            />
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

      <section className="mt-4 px-5" ref={searchRef}>
        <div className="relative">
          <div className="flex items-center gap-3 rounded-2xl bg-accent/40 border border-accent px-4 py-3 shadow-soft transition-all duration-200 focus-within:bg-accent/60 focus-within:ring-2 focus-within:ring-primary/30">
            <span className="h-8 w-8 grid place-items-center rounded-full bg-primary/10 shrink-0">
              {searchFocused || searchQuery ? (
                <X
                  className="h-4 w-4 text-primary cursor-pointer"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchFocused(false);
                  }}
                />
              ) : (
                <Search className="h-4 w-4 text-primary" />
              )}
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="O que voce procura agora?"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              aria-label="Pesquisa global"
            />
          </div>

          {searchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-surface border border-border shadow-elevated z-50 max-h-80 overflow-y-auto">
              {searchQuery.trim() && searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.slice(0, 10).map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchFocused(false);
                        navigate({ to: result.route as never });
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 text-left transition-colors"
                    >
                      <span className="text-lg shrink-0">{result.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{result.label}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {result.subtitle}
                        </div>
                      </div>
                      <span className="text-[10px] text-primary font-semibold shrink-0">
                        {result.type}
                      </span>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum resultado encontrado
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Categorias
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {searchCategories.map((cat) => (
                      <button
                        key={cat.type}
                        type="button"
                        onClick={() => setSearchFocused(false)}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-accent/50 transition-colors"
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-[10px] text-muted-foreground">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mt-5">
        <SmartFeed />
      </div>
    </div>
  );
}
