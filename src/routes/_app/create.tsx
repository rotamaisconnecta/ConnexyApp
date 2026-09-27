import { createFileRoute, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { StatusBar } from "@/components/phone-frame";
import { Lock } from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { motion } from "framer-motion";
import { getStoredRoles } from "@/lib/roles/roles-storage";
import { UserRole } from "@/lib/roles/roles-types";
import RoleActivationModal from "@/components/roles/RoleActivationModal";
import { CANONICAL_POST_PUBLISH_ROUTE } from "@/lib/create/create-hub-destinations";
import { CANONICAL_REEL_PUBLISH_ROUTE } from "@/lib/reels/canonical-reel-publish-route";

export const Route = createFileRoute("/_app/create")({
  head: () => ({ meta: [{ title: "Criar publicação" }] }),
  component: CreatePage,
});

interface CreatePanelItem {
  id: string;
  emoji: string;
  title: string;
  description: string;
  route: string;
  requiredRole: UserRole | null;
  lockedReason: string;
  /** Sobrescreve o rótulo padrão "Criar {title}" quando a ação não é uma criação. */
  label?: string;
}

const CREATE_PANEL: CreatePanelItem[] = [
  {
    id: "photo",
    emoji: "📷",
    title: "Foto",
    description: "Compartilhe uma foto com o mundo",
    route: CANONICAL_POST_PUBLISH_ROUTE,
    requiredRole: null,
    lockedReason: "",
  },
  {
    id: "moment",
    emoji: "⚡",
    title: "Momento",
    description: "Compartilhe um momento no seu perfil",
    route: "/create/moment",
    requiredRole: null,
    lockedReason: "",
  },
  {
    id: "event",
    emoji: "🎉",
    title: "Evento",
    description: "Crie um evento no catálogo local",
    route: "/create/event",
    requiredRole: null,
    lockedReason: "",
  },
  {
    id: "business",
    emoji: "🏪",
    title: "Negócio",
    description: "Cadastre um negócio no catálogo local",
    route: "/create/place-business",
    requiredRole: null,
    lockedReason: "",
  },
  {
    id: "place",
    emoji: "📍",
    title: "Local",
    description: "Cadastre um local no catálogo local",
    route: "/create/place",
    requiredRole: null,
    lockedReason: "",
  },
  {
    id: "marketplace",
    emoji: "🛍️",
    title: "Marketplace",
    description: "Publique um produto ou oferta à venda",
    route: "/create/offer",
    requiredRole: null,
    lockedReason: "",
  },
  {
    id: "reel",
    emoji: "🎬",
    title: "Agora",
    description: "Crie vídeos curtos e criativos",
    route: CANONICAL_REEL_PUBLISH_ROUTE,
    requiredRole: null,
    lockedReason: "",
  },
  {
    id: "own-profile",
    emoji: "👤",
    title: "Perfil",
    label: "Meu Perfil",
    description: "Veja e edite o seu próprio perfil",
    route: "/perfil",
    requiredRole: null,
    lockedReason: "",
  },
  {
    id: "carona",
    emoji: "🤝",
    title: "Carona Amiga",
    description: "Ofereça uma vaga na sua viagem",
    route: "/carona/nova",
    requiredRole: null,
    lockedReason: "",
  },
];

const listContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: "easeOut" as const },
  },
};

function CreatePage() {
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRoot = pathname === "/create" || pathname === "/_app/create";
  const [roles, setRoles] = useState(() => getStoredRoles().roles);
  const [requiredRole, setRequiredRole] = useState<UserRole | null>(null);

  const handleRoleChanged = useCallback(() => {
    setRoles(getStoredRoles().roles);
  }, []);

  useEffect(() => {
    window.addEventListener("roleChanged", handleRoleChanged);
    return () => window.removeEventListener("roleChanged", handleRoleChanged);
  }, [handleRoleChanged]);

  function open(item: CreatePanelItem) {
    if (item.requiredRole && !roles.includes(item.requiredRole)) {
      setRequiredRole(item.requiredRole);
      return;
    }
    nav({ to: item.route as never });
  }

  function handleActivated() {
    setRoles(getStoredRoles().roles);
    setRequiredRole(null);
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <StatusBar />

      {isRoot ? (
        <>
          <div className="flex items-center gap-3 px-5 pt-1 pb-3 shrink-0">
            <BackButton
              fallbackTo="/home"
              className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
            />
            <div>
              <h1 className="font-display font-bold text-base">Criar publicação</h1>
              <p className="text-[11px] text-muted-foreground">O que você deseja compartilhar?</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <motion.div
              variants={listContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {CREATE_PANEL.map((item) => {
                const locked = !!item.requiredRole && !roles.includes(item.requiredRole);
                return (
                  <motion.button
                    key={item.id}
                    variants={listItem}
                    whileHover={{ scale: locked ? 1.0 : 1.02 }}
                    whileTap={{ scale: locked ? 0.98 : 0.97 }}
                    onClick={() => open(item)}
                    aria-label={item.label ?? `Criar ${item.title}`}
                    className="flex items-center gap-4 rounded-[24px] border border-border bg-surface p-4 text-left shadow-soft outline-none transition-shadow hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-primary/50"
                    style={{ opacity: locked ? 0.6 : 1 }}
                  >
                    <span className="h-14 w-14 shrink-0 grid place-items-center rounded-2xl bg-primary/10 text-3xl">
                      {item.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm">
                          {item.label ?? `Criar ${item.title}`}
                        </span>
                        {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground leading-snug">
                        {locked ? item.lockedReason : item.description}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          {requiredRole && (
            <RoleActivationModal open role={requiredRole} onClose={handleActivated} />
          )}
        </>
      ) : (
        <Outlet />
      )}
    </div>
  );
}
