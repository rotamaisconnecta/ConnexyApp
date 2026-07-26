import type { ReactNode } from "react";
import { getStoredRoles } from "@/lib/roles/roles-storage";
import { getPermissionsForRoles } from "@/lib/roles/roles-utils";
import type { UserPermissions } from "@/lib/roles/roles-types";

interface RolePermissionProps {
  requires: keyof UserPermissions;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RolePermission({ requires, children, fallback = null }: RolePermissionProps) {
  const { roles } = getStoredRoles();
  const permissions = getPermissionsForRoles(roles);

  if (permissions[requires]) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
