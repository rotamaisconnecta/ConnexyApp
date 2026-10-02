import { createFileRoute, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { motion } from "framer-motion";
import { getStoredRoles } from "@/lib/roles/roles-storage";
import { UserRole } from "@/lib/roles/roles-types";
import RoleActivationModal from "@/components/roles/RoleActivationModal";
import {
  CANONICAL_POST_PUBLISH_ROUTE,
  CANONICAL_RIDE_CREATE_ROUTE,
} from "@/lib/create/create-hub-destinations";
import { CANONICAL_REEL_PUBLISH_ROUTE } from "@/lib/reels/canonical-reel-publish-route";
import { CreateCardArt, type CreateArtId } from "@/components/create/create-card-art";
import { CreateOptionCard } from "@/components/create/create-option-card";
import { TypeScale } from "@/theme/typography";

export const Route = createFileRoute("/_app/create")({
  head: () => ({ meta: [{ title: "Criar" }] }),
  component: CreatePage,
});

interface CreatePanelItem {
  id: string;
  title: string;
  description: string;
  route: string;
  requiredRole: UserRole | null;
  lockedReason: string;
  label?: string;
  art: CreateArtId;
  featured?: boolean;
}

const CREATE_PANEL: CreatePanelItem[] = [
  {
    id: "photo",
    title: "Foto",
    description: "Compartilhe um momento com o mundo",
    route: CANONICAL_POST_PUBLISH_ROUTE,
    requiredRole: null,
    lockedReason: "",
    label: "Criar Foto",
    art: "photo",
    featured: true,
  },
  {
    id: "event",
    title: "Evento",
    description: "Crie um evento no catálogo local",
    route: "/create/event",
    requiredRole: null,
    lockedReason: "",
    label: "Criar Evento",
    art: "event",
  },
  {
    id: "place",
    title: "Local",
    description: "Cadastre um local no catálogo local",
    route: "/create/place",
    requiredRole: null,
    lockedReason: "",
    label: "Criar Local",
    art: "place",
  },
  {
    id: "business",
    title: "Negócio",
    description: "Cadastre um negócio no catálogo local",
    route: "/create/place-business",
    requiredRole: null,
    lockedReason: "",
    label: "Criar Negócio",
    art: "business",
  },
  {
    id: "carona",
    title: "Carona Amiga",
    description: "Ofereça uma vaga na sua viagem",
    route: "/carona/nova",
    requiredRole: null,
    lockedReason: "",
    art: "ride",
  },
  {
    id: "reel",
    title: "Agora",
    description: "Grave um vídeo curto do momento",
    route: CANONICAL_REEL_PUBLISH_ROUTE,
    requiredRole: null,
    lockedReason: "",
    label: "Criar Reel",
    art: "reel",
    featured: true,
  },
  {
    id: "hail",
    title: "Corrida",
    label: "Pedir corrida",
    description: "Peça uma corrida para chegar ao seu destino.",
    route: CANONICAL_RIDE_CREATE_ROUTE,
    requiredRole: null,
    lockedReason: "",
    art: "hail",
  },
  {
    id: "browse-marketplace",
    title: "Marketplace",
    label: "Abrir Marketplace",
    description: "Descubra empresas e promoções perto de você",
    route: "/marketplace",
    requiredRole: null,
    lockedReason: "",
    art: "browse",
  },
];

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
              <h1 className={`font-display font-bold ${TypeScale.screenTitle}`}>Criar</h1>
              <p className={`text-muted-foreground ${TypeScale.meta}`}>O que deseja partilhar?</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              {CREATE_PANEL.map((item) => {
                const locked = !!item.requiredRole && !roles.includes(item.requiredRole);
                const title = item.label ?? `Criar ${item.title}`;
                return (
                  <CreateOptionCard
                    key={item.id}
                    title={title}
                    description={locked ? item.lockedReason : item.description}
                    featured={item.featured}
                    locked={locked}
                    onClick={() => open(item)}
                    ariaLabel={title}
                  >
                    <CreateCardArt id={item.art} />
                  </CreateOptionCard>
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
