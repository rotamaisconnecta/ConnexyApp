import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, HandHeart, Search, Users } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { TypeScale } from "@/theme/typography";
import { CARONA_HUB_ACTIONS, type CaronaHubAction } from "@/lib/carona/carona-hub-actions";

export const Route = createFileRoute("/_app/carona")({
  head: () => ({ meta: [{ title: "Carona Amiga — Connexy" }] }),
  component: CaronaHubLayout,
});

function CaronaHubLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname.replace(/\/$/, "") === "/carona") return <CaronaHubPage />;
  return <Outlet />;
}

const HUB_ICONS = {
  encontrar: Search,
  oferecer: HandHeart,
  minhas: CalendarClock,
} as const;

const HUB_ROUTES: Record<CaronaHubAction["id"], string> = {
  encontrar: "/carona/encontrar",
  oferecer: "/carona/nova",
  minhas: "/carona/minhas",
};

function CaronaHubPage() {
  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <StatusBar />

      <div className="flex items-center gap-3 px-5 pt-1 pb-2 shrink-0">
        <BackButton
          fallbackTo="/home"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <h1 className={`font-display font-bold ${TypeScale.screenTitle}`}>Carona Amiga</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <p className="max-w-[30ch] text-balance text-[15px] leading-relaxed text-muted-foreground">
          Encontre alguém que vai para o mesmo lugar ou ofereça uma vaga na sua viagem.
        </p>

        <div className="mt-7 space-y-3">
          {CARONA_HUB_ACTIONS.map((action, index) => (
            <HubAction key={action.id} action={action} index={index} />
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-3xl border border-border/70 bg-surface/70 px-4 py-3.5">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.1} />
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Endereços residenciais e localização em tempo real nunca ficam visíveis. O ponto de
            embarque é sempre um local combinado por quem oferece a carona.
          </p>
        </div>
      </div>
    </div>
  );
}

function HubAction({ action, index }: { action: CaronaHubAction; index: number }) {
  const Icon = HUB_ICONS[action.id];
  const primary = action.id === "encontrar";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.05, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <Link
        to={HUB_ROUTES[action.id]}
        className={
          primary
            ? "flex w-full items-center justify-between gap-4 rounded-[26px] bg-gradient-brand px-5 py-5 text-left text-white shadow-[0_14px_32px_rgba(109,40,217,0.26)] transition active:scale-[0.98]"
            : "flex w-full items-center justify-between gap-4 rounded-[26px] border border-border bg-surface px-5 py-4.5 transition active:scale-[0.98]"
        }
      >
        <span className="min-w-0 flex-1">
          <span
            className={`flex items-center gap-2 font-display font-bold leading-tight tracking-tight ${
              primary ? "text-[19px] text-white" : "text-[17px] text-foreground"
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.2} />
            {action.title}
          </span>
          <span
            className={`mt-1 block text-[12px] leading-snug ${
              primary ? "text-white/80" : "text-muted-foreground"
            }`}
          >
            {action.description}
          </span>
        </span>
        <ArrowRight
          className={`h-[18px] w-[18px] shrink-0 ${primary ? "text-white" : "text-muted-foreground"}`}
          strokeWidth={2.2}
        />
      </Link>
    </motion.div>
  );
}