import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

import { UserRole, type RoleMode } from "@/lib/roles/roles-types";
import { getStoredRoles, toggleRole, setActiveMode } from "@/lib/roles/roles-storage";
import { getActivatableRoles } from "@/lib/roles/roles-utils";

import RoleCard from "./RoleCard";
import RoleGrid from "./RoleGrid";

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
      if (!wasActive) {
        setActiveMode(role as RoleMode);
      }
      setRolesState(getStoredRoles());
      window.dispatchEvent(new Event("roleChanged"));

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

const ACTIVATION_ROUTES: Partial<Record<UserRole, string>> = {
  [UserRole.DRIVER]: "/driver",
  [UserRole.BUSINESS]: "/marketplace",
  [UserRole.EVENT_CREATOR]: "/feed",
  [UserRole.PLACE_OWNER]: "/locais",
  [UserRole.REELS_CREATOR]: "/create/reel",
};
