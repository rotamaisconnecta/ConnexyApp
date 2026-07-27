import { UserRole, type UserRolesState } from "@/lib/roles/roles-types";
import { getActivatableRoles } from "@/lib/roles/roles-utils";
import RoleCard from "./RoleCard";

interface RoleSelectorProps {
  rolesState: UserRolesState;
  onToggleRole: (role: UserRole) => void;
}

export function RoleSelector({ rolesState, onToggleRole }: RoleSelectorProps) {
  const activatable = getActivatableRoles();

  return (
    <div className="grid grid-cols-1 gap-3">
      {activatable.map((def) => (
        <RoleCard
          key={def.id}
          role={def.id}
          title={def.label}
          description={def.description}
          active={rolesState.roles.includes(def.id)}
          onClick={() => onToggleRole(def.id)}
        />
      ))}
    </div>
  );
}
