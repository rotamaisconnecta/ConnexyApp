import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

import { UserRole } from "@/lib/roles/roles-types";
import { getStoredRoles, toggleRole } from "@/lib/roles/roles-storage";
import { getActivatableRoles } from "@/lib/roles/roles-utils";

import RoleCard from "./RoleCard";
import RoleGrid from "./RoleGrid";

const ACTIVATION_ROUTES: Partial<Record<UserRole, string>> = {
  [UserRole.DRIVER]: "/driver/cadastro",
  [UserRole.BUSINESS]: "/business/cadastro",
  [UserRole.EVENT_CREATOR]: "/events/cadastro",
  [UserRole.PLACE_OWNER]: "/places/cadastro",
  [UserRole.REELS_CREATOR]: "/create/reel",
};

export default function RoleSelector() {
  const navigate = useNavigate();
  const activatable = getActivatableRoles();
  const [rolesState, setRolesState] = useState(() => getStoredRoles());

  const hasRole = useCallback(
    (role: UserRole) => rolesState.roles.includes(role),
    [rolesState.roles],
  );

  const handleToggle = useCallback(
    (role: UserRole) => {
      const wasActive = hasRole(role);
      toggleRole(role);
      setRolesState(getStoredRoles());

      if (!wasActive) {
        const route = ACTIVATION_ROUTES[role];
        if (route) {
          navigate({ to: route as never });
        }
      }
    },
    [hasRole, navigate],
  );

  return (
    <RoleGrid>
      {activatable.map((def) => (
        <RoleCard
          key={def.id}
          role={def.id}
          title={def.label}
          description={def.description}
          active={hasRole(def.id)}
          onClick={() => handleToggle(def.id)}
        />
      ))}
    </RoleGrid>
  );
}
