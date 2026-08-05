import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import RoleHeader from "@/components/roles/RoleHeader";
import RoleSelector from "@/components/roles/RoleSelector";
import { UserRole, type UserRolesState } from "@/lib/roles/roles-types";
import { getStoredRoles } from "@/lib/roles/roles-storage";

export const Route = createFileRoute("/_app/profile/roles")({
  head: () => ({ meta: [{ title: "Meu Connexy — Connexy" }] }),
  component: RolesPage,
});

function RolesPage() {
  const [rolesState, setRolesState] = useState<UserRolesState>(getStoredRoles);
  const activeCount = rolesState.roles.filter((r) => r !== UserRole.USER).length;

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
        <BackButton
          fallbackTo="/profile"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <div className="flex-1">
          <h1 className="font-display font-bold text-base">Meu Connexy</h1>
          <p className="text-[11px] text-muted-foreground">
            {activeCount} recurso{activeCount !== 1 ? "s" : ""} criado
            {activeCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <RoleHeader />
        <RoleSelector />

        {/* Info */}
        {activeCount === 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-secondary/30 border border-border/50">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Escolha o que deseja criar. Após a criação, o recurso ficará disponível
              automaticamente no seu Connexy. Você pode criar quantos quiser.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
