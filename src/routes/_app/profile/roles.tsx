import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft, Check } from "lucide-react";

import { StatusBar } from "@/components/phone-frame";
import RoleHeader from "@/components/roles/RoleHeader";
import RoleSwitcher from "@/components/roles/RoleSwitcher";
import RoleSelector from "@/components/roles/RoleSelector";
import RoleBadge from "@/components/roles/RoleBadge";
import { BrandCard } from "@/components/ui/brand-card";
import { UserRole, type UserRolesState } from "@/lib/roles/roles-types";
import { getStoredRoles } from "@/lib/roles/roles-storage";
import { getPermissionsForRoles } from "@/lib/roles/roles-utils";
import { Colors } from "@/theme";

export const Route = createFileRoute("/_app/profile/roles")({
  head: () => ({ meta: [{ title: "Funcionalidades — Connexy" }] }),
  component: RolesPage,
});

const PERMISSION_LABELS: Record<keyof import("@/lib/roles/roles-types").UserPermissions, string> = {
  canDrive: "Dirigir",
  canPublishRide: "Publicar caronas",
  canReceiveRide: "Receber caronas",
  canCreateBusiness: "Criar empresa",
  canCreateOffer: "Criar ofertas",
  canManageCoupons: "Gerenciar cupons",
  canManageEmployees: "Gerenciar funcionários",
  canCreateCampaigns: "Criar campanhas",
  canCreateEvent: "Criar eventos",
  canManageEvents: "Gerenciar eventos",
  canCreatePlace: "Criar places",
  canCreateReel: "Criar reels",
  canPublishMoment: "Publicar moments",
  canPublishPhoto: "Publicar fotos",
  canPublishVideo: "Publicar vídeos",
  canPublishText: "Publicar textos",
  canAccessDriverDashboard: "Dashboard motorista",
  canAccessBusinessDashboard: "Dashboard empresa",
  canSeeAnalytics: "Ver analytics",
  canModerateCommunity: "Moderar comunidade",
  canReceivePayments: "Receber pagamentos",
};

const PERMISSION_ICONS: Record<keyof import("@/lib/roles/roles-types").UserPermissions, string> = {
  canDrive: "🚗",
  canPublishRide: "📢",
  canReceiveRide: "🎯",
  canCreateBusiness: "🏢",
  canCreateOffer: "💰",
  canManageCoupons: "🎟",
  canManageEmployees: "👥",
  canCreateCampaigns: "📣",
  canCreateEvent: "📅",
  canManageEvents: "⚙",
  canCreatePlace: "📍",
  canCreateReel: "🎬",
  canPublishMoment: "✨",
  canPublishPhoto: "📸",
  canPublishVideo: "🎥",
  canPublishText: "📝",
  canAccessDriverDashboard: "📊",
  canAccessBusinessDashboard: "📊",
  canSeeAnalytics: "📈",
  canModerateCommunity: "🛡",
  canReceivePayments: "💳",
};

function RolesPage() {
  const [rolesState, setRolesState] = useState<UserRolesState>(getStoredRoles);
  const activeCount = rolesState.roles.filter((r) => r !== UserRole.USER).length;
  const permissions = getPermissionsForRoles(rolesState.roles);

  function handleRoleChanged() {
    setRolesState(getStoredRoles());
  }

  useEffect(() => {
    window.addEventListener("roleChanged", handleRoleChanged);
    return () => window.removeEventListener("roleChanged", handleRoleChanged);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <StatusBar />

      <div className="flex items-center gap-3 px-5 pt-1 pb-3 shrink-0">
        <Link to="/profile" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-base">Funcionalidades</h1>
          <p className="text-[11px] text-muted-foreground">
            {activeCount} função{activeCount !== 1 ? "ões" : ""} ativa
            {activeCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Active roles summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-4"
        >
          {rolesState.roles.map((role) => (
            <RoleBadge key={role} role={role} size="md" />
          ))}
        </motion.div>

        {/* Mode switcher */}
        <div className="mb-5">
          <p className="text-xs font-medium mb-2" style={{ color: Colors.text.secondary }}>
            Modo ativo
          </p>
          <RoleSwitcher onChange={handleRoleChanged} />
        </div>

        {/* Role selector */}
        <RoleHeader />
        <RoleSelector />

        {/* Permissions summary */}
        {activeCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <h3 className="text-sm font-bold mb-3" style={{ color: Colors.text.primary }}>
              Permissões ativas
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PERMISSION_LABELS) as (keyof typeof PERMISSION_LABELS)[]).map((key) => {
                const allowed = permissions[key];
                return (
                  <BrandCard key={key} padding shadow="soft" className="flex items-center gap-2">
                    <span className="text-sm leading-none">{PERMISSION_ICONS[key]}</span>
                    <span
                      className="text-xs flex-1 min-w-0 truncate"
                      style={{ color: Colors.text.primary }}
                    >
                      {PERMISSION_LABELS[key]}
                    </span>
                    {allowed && (
                      <Check size={14} style={{ color: Colors.success }} className="shrink-0" />
                    )}
                  </BrandCard>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 rounded-2xl bg-secondary/30 border border-border/50">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Você pode ativar quantas funções quiser. Todas coexistem na mesma conta. O modo ativo
            (Usuário, Motorista ou Empresa) controla a navegação e o que aparece na tela inicial.
          </p>
        </div>
      </div>
    </div>
  );
}
