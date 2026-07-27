import { useMemo } from "react";
import { motion } from "framer-motion";
import { User, Car, Store } from "lucide-react";

import { UserRole, type RoleMode } from "@/lib/roles/roles-types";
import { getStoredRoles, setActiveMode } from "@/lib/roles/roles-storage";
import { Colors, Shadows } from "@/theme";

interface RoleSwitcherProps {
  onChange?: (role: UserRole) => void;
}

const roleIcons: Record<RoleMode, typeof User> = {
  [UserRole.USER]: User,
  [UserRole.DRIVER]: Car,
  [UserRole.BUSINESS]: Store,
};

const roleLabels: Record<RoleMode, string> = {
  [UserRole.USER]: "Usuário",
  [UserRole.DRIVER]: "Motorista",
  [UserRole.BUSINESS]: "Empresa",
};

export default function RoleSwitcher({ onChange }: RoleSwitcherProps) {
  const roles = getStoredRoles();
  const activeRole = getActiveMode();

  const availableRoles = useMemo(() => {
    return roles.roles
      .filter((r): r is RoleMode => r in roleIcons)
      .map((role) => ({
        role,
        label: roleLabels[role],
        icon: roleIcons[role],
      }));
  }, [roles.roles]);

  function handleSwitch(role: RoleMode) {
    setActiveMode(role);
    onChange?.(role);
    window.dispatchEvent(new Event("roleChanged"));
  }

  return (
    <div
      className="relative flex w-full rounded-full p-1"
      style={{ background: Colors.surface, boxShadow: Shadows.soft }}
    >
      {availableRoles.map((item) => {
        const Icon = item.icon;
        const isSelected = item.role === activeRole;
        const iconColor = isSelected ? Colors.brand.primary : Colors.text.secondary;

        return (
          <motion.button
            key={item.role}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSwitch(item.role)}
            className="relative flex-1 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 z-10"
          >
            {isSelected && (
              <motion.div
                layoutId="role-switcher-active"
                className="absolute inset-0 rounded-full"
                style={{ background: Colors.card, boxShadow: Shadows.medium }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon size={16} className="relative z-10" style={{ color: iconColor }} />
            <span className="relative z-10 text-sm font-medium" style={{ color: iconColor }}>
              {item.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

function getActiveMode(): RoleMode {
  return getStoredRoles().activeMode;
}
