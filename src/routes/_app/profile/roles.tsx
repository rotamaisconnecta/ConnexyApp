import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { ChevronLeft } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { RoleSelector } from "@/components/roles/RoleSelector";
import { RoleHeader } from "@/components/roles/RoleHeader";
import { RoleEmpty } from "@/components/roles/RoleEmpty";
import { RoleBadge } from "@/components/roles/RoleBadge";
import { UserRole, type UserRolesState } from "@/lib/roles/roles-types";
import { getStoredRoles, saveRoles } from "@/lib/roles/roles-storage";
import { getActivatableRoles } from "@/lib/roles/roles-utils";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/profile/roles")({
  head: () => ({ meta: [{ title: "Funcionalidades — Connexy" }] }),
  component: RolesPage,
});

function RolesPage() {
  const [rolesState, setRolesState] = useState<UserRolesState>(getStoredRoles);
  const activatable = getActivatableRoles();
  const activeCount = rolesState.roles.filter((r) => r !== UserRole.USER).length;

  const handleToggleRole = useCallback((role: UserRole) => {
    setRolesState((prev) => {
      const hasRole = prev.roles.includes(role);
      const newRoles = hasRole ? prev.roles.filter((r) => r !== role) : [...prev.roles, role];

      if (newRoles.length === 0) newRoles.push(UserRole.USER);

      const newMode = hasRole && prev.activeMode === role ? UserRole.USER : prev.activeMode;

      const next: UserRolesState = {
        ...prev,
        roles: newRoles,
        activeMode: newMode,
        lastMode: newMode,
      };
      saveRoles(next);
      return next;
    });
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

        {/* Role selector */}
        <RoleHeader />
        <RoleSelector rolesState={rolesState} onToggleRole={handleToggleRole} />

        {activeCount === 0 && (
          <div className="mt-4">
            <RoleEmpty />
          </div>
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
