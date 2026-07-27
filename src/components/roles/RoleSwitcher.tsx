import { motion } from "framer-motion";
import { User, Car, Store } from "lucide-react";
import { useMemo } from "react";

import { UserRole, RoleMode } from "@/lib/roles/roles-types";

import { getStoredRoles, getActiveMode, setActiveMode } from "@/lib/roles/roles-storage";

interface Props {
  onChange?: (role: UserRole) => void;
}

export default function RoleSwitcher({ onChange }: Props) {
  const roles = getStoredRoles();
  const activeRole = getActiveMode();

  const availableRoles = useMemo(() => {
    return roles.roles.map((role) => {
      switch (role) {
        case UserRole.DRIVER:
          return { role, label: "Motorista", icon: Car };
        case UserRole.BUSINESS:
          return { role, label: "Empresa", icon: Store };
        default:
          return { role: UserRole.USER, label: "Usuário", icon: User };
      }
    });
  }, [roles.roles]);

  function handleSwitch(role: UserRole) {
    setActiveMode(role as RoleMode);
    onChange?.(role);
    window.dispatchEvent(new Event("roleChanged"));
  }

  return (
    <div className="w-full rounded-full bg-muted p-1">
      <div className="flex">
        {availableRoles.map((item) => {
          const Icon = item.icon;
          const selected =
            item.role === (activeRole as UserRole);
          return (
            <motion.button
              key={item.role}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSwitch(item.role)}
              className={[
                "flex-1",
                "rounded-full",
                "px-4",
                "py-2",
                "transition-all",
                "duration-200",
                selected ? "bg-white shadow text-violet-700" : "text-muted-foreground",
              ].join(" ")}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon size={16} />
                <span className="font-medium">{item.label}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
