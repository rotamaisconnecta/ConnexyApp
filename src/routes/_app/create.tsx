import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBar } from "@/components/phone-frame";
import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CREATE_ACTIONS } from "@/lib/navigation/navigation-items";
import RoleActivationModal from "@/components/roles/RoleActivationModal";
import { getStoredRoles } from "@/lib/roles/roles-storage";
import { UserRole } from "@/lib/roles/roles-types";
import {
  canCreateOffer,
  canCreateEvent,
  canCreatePlace,
  canPublishRide,
} from "@/lib/roles/roles-guards";

export const Route = createFileRoute("/_app/create")({
  head: () => ({ meta: [{ title: "Criar publicação" }] }),
  component: CreatePage,
});

const gridContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const gridItem = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

function CreatePage() {
  const nav = useNavigate();
  const { roles } = getStoredRoles();
  const [requiredRole, setRequiredRole] = useState<UserRole | null>(null);

  function open(category: string) {
    switch (category) {
      case "photo":
        return nav({ to: "/create/photo" });
      case "video":
        return nav({ to: "/create/video" });
      case "text":
        return nav({ to: "/create/text" });
      case "moment":
        return nav({ to: "/create/moment" });
      case "reel":
        return nav({ to: "/create/reel" });
      case "ride":
        if (!canPublishRide(roles)) {
          setRequiredRole(UserRole.DRIVER);
          return;
        }
        return nav({ to: "/create/ride" });
      case "offer":
        if (!canCreateOffer(roles)) {
          setRequiredRole(UserRole.BUSINESS);
          return;
        }
        return nav({ to: "/create/offer" });
      case "event":
        if (!canCreateEvent(roles)) {
          setRequiredRole(UserRole.EVENT_CREATOR);
          return;
        }
        return nav({ to: "/create/event" });
      case "place":
        if (!canCreatePlace(roles)) {
          setRequiredRole(UserRole.PLACE_OWNER);
          return;
        }
        return nav({ to: "/create/place" });
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <StatusBar />

      <div className="flex items-center gap-3 px-5 pt-1 pb-3 shrink-0">
        <Link to="/feed" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-base">Criar publicação</h1>
          <p className="text-[11px] text-muted-foreground">O que você deseja compartilhar?</p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-[140px] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <motion.div
          variants={gridContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-4 justify-items-center"
        >
          {CREATE_ACTIONS.map((action) => (
            <motion.button
              key={action.id}
              variants={gridItem}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => open(action.id.toLowerCase())}
              aria-label={`Criar ${action.label}`}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface shadow-soft hover:shadow-elevated transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <div className="h-16 w-16 rounded-full bg-white shadow-soft grid place-items-center text-3xl">
                {action.emoji}
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold leading-tight">{action.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  {action.description}
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {requiredRole && (
        <RoleActivationModal
          open
          role={requiredRole}
          onClose={() => setRequiredRole(null)}
        />
      )}
    </div>
  );
}
