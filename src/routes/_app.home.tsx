import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, MessageSquare, Search } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SmartFeed } from "@/components/feed/SmartFeed";
import { currentUser } from "@/lib/mock-data";

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

function Home() {
  const firstName = currentUser.name.split(" ")[0];

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

      <section className="mt-4 px-5">
        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-2xl bg-accent/40 border border-accent px-4 py-3 shadow-soft transition-all duration-200 hover:bg-accent/60 active:scale-[0.98]"
        >
          <span className="h-8 w-8 grid place-items-center rounded-full bg-primary/10 shrink-0">
            <Search className="h-4 w-4 text-primary" />
          </span>
          <span className="text-sm text-muted-foreground">O que voce procura agora?</span>
        </button>
      </section>

      <div className="mt-5">
        <SmartFeed />
      </div>
    </div>
  );
}
