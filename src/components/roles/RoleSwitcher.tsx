import { UserRole, type RoleMode } from "@/lib/roles/roles-types";
import { getRoleDefinition, getActivatableRoles } from "@/lib/roles/roles-utils";
import { cn } from "@/lib/utils";

interface RoleSwitcherProps {
  activeMode: RoleMode;
  availableRoles: UserRole[];
  onModeChange: (mode: RoleMode) => void;
  className?: string;
}

export function RoleSwitcher({
  activeMode,
  availableRoles,
  onModeChange,
  className,
}: RoleSwitcherProps) {
  const modesToShow = availableRoles.filter(
    (r) => r === UserRole.USER || r === UserRole.DRIVER || r === UserRole.BUSINESS,
  );

  if (modesToShow.length <= 1) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-2xl bg-secondary/50 border border-border/50",
        className,
      )}
    >
      {modesToShow.map((role) => {
        const def = getRoleDefinition(role);
        if (!def) return null;
        const isActive = activeMode === role;
        return (
          <button
            key={role}
            type="button"
            onClick={() => onModeChange(role as RoleMode)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200",
              isActive
                ? "bg-white text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{def.emoji}</span>
            <span>{def.label}</span>
          </button>
        );
      })}
    </div>
  );
}
