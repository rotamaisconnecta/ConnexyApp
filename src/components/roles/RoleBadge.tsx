import { cn } from "@/lib/utils";
import { getRoleDefinition } from "@/lib/roles/roles-utils";
import { UserRole } from "@/lib/roles/roles-types";

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md";
  className?: string;
}

export function RoleBadge({ role, size = "sm", className }: RoleBadgeProps) {
  const def = getRoleDefinition(role);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-2.5 py-1 text-xs",
        className,
      )}
      style={{
        backgroundColor: `${def.color}15`,
        color: def.color,
      }}
    >
      <span>{def.emoji}</span>
      <span>{def.title}</span>
    </span>
  );
}
