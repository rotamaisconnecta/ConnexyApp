import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { UserRole } from "@/lib/roles/roles-types";
import { getStoredRoles } from "@/lib/roles/roles-storage";
import { getActivatableRoles } from "@/lib/roles/roles-utils";

import RoleCard from "./RoleCard";
import RoleGrid from "./RoleGrid";

export default function RoleSelector() {
  const navigate = useNavigate();
  const activatable = getActivatableRoles();
  const [rolesState, setRolesState] = useState(() => getStoredRoles());

  useEffect(() => {
    function handleChange() {
      setRolesState(getStoredRoles());
    }
    window.addEventListener("roleChanged", handleChange);
    return () => window.removeEventListener("roleChanged", handleChange);
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => rolesState.roles.includes(role),
    [rolesState.roles],
  );

  function handleClick(role: UserRole) {
    const route = CREATE_ROUTES[role];
    if (route) {
      navigate({ to: route as never });
    }
  }

  return (
    <RoleGrid>
      {activatable.map((def) => (
        <RoleCard
          key={def.id}
          role={def.id}
          title={def.label}
          description={def.description}
          active={hasRole(def.id)}
          onClick={() => handleClick(def.id)}
        />
      ))}
    </RoleGrid>
  );
}

const CREATE_ROUTES: Partial<Record<UserRole, string>> = {
  [UserRole.DRIVER]: "/driver",
  [UserRole.BUSINESS]: "/create/place-business",
  [UserRole.EVENT_CREATOR]: "/create/event",
  [UserRole.PLACE_OWNER]: "/create/place",
  [UserRole.REELS_CREATOR]: "/create/reel",
};
