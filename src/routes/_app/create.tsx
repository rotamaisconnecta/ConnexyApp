import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { StatusBar } from "@/components/phone-frame";
import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { getStoredRoles } from "@/lib/roles/roles-storage";
import { getCreateActionsForRoles } from "@/lib/roles/roles-engine";
import type { CreateAction } from "@/lib/roles/roles-engine";
import type { UserRole } from "@/lib/roles/roles-types";
import RoleActivationModal from "@/components/roles/RoleActivationModal";
import { Colors, Radius, Shadows } from "@/theme";

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
  const [roles, setRoles] = useState(() => getStoredRoles().roles);
  const [requiredRole, setRequiredRole] = useState<UserRole | null>(null);
  const actions = getCreateActionsForRoles(roles);

  const handleRoleChanged = useCallback(() => {
    setRoles(getStoredRoles().roles);
  }, []);

  useEffect(() => {
    window.addEventListener("roleChanged", handleRoleChanged);
    return () => window.removeEventListener("roleChanged", handleRoleChanged);
  }, [handleRoleChanged]);

  function open(action: CreateAction) {
    if (!action.enabled) {
      if (action.requiredRole) {
        setRequiredRole(action.requiredRole);
      }
      return;
    }
    nav({ to: action.route as never });
  }

  function handleActivated() {
    setRoles(getStoredRoles().roles);
    setRequiredRole(null);
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
          {actions.map((action) => {
            const isLocked = !action.enabled;
            return (
              <motion.button
                key={action.id}
                variants={gridItem}
                whileTap={{ scale: isLocked ? 0.97 : 0.95 }}
                whileHover={{ scale: isLocked ? 1.0 : 1.03 }}
                onClick={() => open(action)}
                aria-label={`Criar ${action.title}`}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                style={{
                  background: Colors.surface,
                  boxShadow: Shadows.soft,
                  opacity: isLocked ? 0.55 : 1,
                }}
              >
                <div
                  className="h-16 w-16 rounded-full grid place-items-center text-3xl relative"
                  style={{ background: Colors.card, boxShadow: Shadows.soft }}
                >
                  {action.emoji}
                  {isLocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full grid place-items-center"
                      style={{ background: Colors.brand.primary }}
                    >
                      <Lock size={10} className="text-white" />
                    </motion.div>
                  )}
                </div>
                <div className="text-center">
                  <div
                    className="text-xs font-semibold leading-tight"
                    style={{ color: Colors.text.primary }}
                  >
                    {action.title}
                  </div>
                  {isLocked ? (
                    <div
                      className="text-[10px] mt-0.5 leading-tight line-clamp-2"
                      style={{ color: Colors.text.secondary }}
                    >
                      {action.lockedReason}
                    </div>
                  ) : (
                    <div
                      className="text-[10px] mt-0.5 leading-tight"
                      style={{ color: Colors.text.secondary }}
                    >
                      {getActionDescription(action.id)}
                    </div>
                  )}
                </div>
                {isLocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white"
                    style={{ background: Colors.brand.primary }}
                  >
                    <Lock size={8} />
                    Ativar
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {requiredRole && <RoleActivationModal open role={requiredRole} onClose={handleActivated} />}
    </div>
  );
}

function getActionDescription(id: string): string {
  switch (id) {
    case "photo":
      return "Compartilhe uma foto";
    case "video":
      return "Grave ou envie um vídeo";
    case "reel":
      return "Vídeos curtos";
    case "text":
      return "Compartilhe uma ideia";
    case "moment":
      return "O que está acontecendo agora";
    case "offer":
      return "Criar oferta";
    case "event":
      return "Criar evento";
    case "ride":
      return "Oferecer ou pedir carona";
    case "place":
      return "Cadastrar um lugar";
    default:
      return "";
  }
}
