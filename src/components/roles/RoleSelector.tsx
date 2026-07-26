import { UserRole, type RolesStorage } from "@/lib/roles/roles-types";
import { getActivatableRoles } from "@/lib/roles/roles-utils";
import { RoleCard } from "./RoleCard";

interface RoleSelectorProps {
  rolesState: RolesStorage;
  onToggleRole: (role: UserRole) => void;
}

export function RoleSelector({ rolesState, onToggleRole }: RoleSelectorProps) {
  const activatable = getActivatableRoles();

  return (
    <div className="grid grid-cols-1 gap-3">
      {activatable.map((def) => (
        <RoleCard
          key={def.role}
          definition={def}
          active={rolesState.roles.includes(def.role)}
          onToggle={() => onToggleRole(def.role)}
        />
      ))}
    </div>
  );
}
