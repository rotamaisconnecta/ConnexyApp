import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Car, User, ArrowRight } from "lucide-react";

import { Colors, Shadows } from "@/theme";
import { getStoredRoles, setActiveMode } from "@/lib/roles/roles-storage";
import { UserRole, type RoleMode } from "@/lib/roles/roles-types";

export default function ModeSwitcher() {
  const navigate = useNavigate();
  const [rolesState, setRolesState] = useState(getStoredRoles);
  const hasDriverRole = rolesState.roles.includes(UserRole.DRIVER);
  const activeMode = rolesState.activeMode;

  useEffect(() => {
    function handleRoleChanged() {
      setRolesState(getStoredRoles());
    }

    window.addEventListener("roleChanged", handleRoleChanged);
    return () => window.removeEventListener("roleChanged", handleRoleChanged);
  }, []);

  function handleSelect(mode: RoleMode) {
    if (mode === UserRole.DRIVER && !hasDriverRole) {
      navigate({ to: "/driver/cadastro" });
      return;
    }

    setActiveMode(mode);
    window.dispatchEvent(new Event("roleChanged"));
  }

  if (!hasDriverRole) {
    return (
      <div className="mx-4 mt-3 rounded-[24px] border border-border bg-surface p-2 shadow-soft">
        <button
          type="button"
          onClick={() => navigate({ to: "/driver/cadastro" })}
          className="flex w-full items-center justify-between rounded-full bg-primary/10 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white">
              <Car className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Tornar-me Motorista
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Ative o modo motorista e receba solicitações
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-3 rounded-[24px] border border-border bg-surface p-2 shadow-soft">
      <div
        className="relative flex items-center rounded-full p-1"
        style={{ background: Colors.surface, boxShadow: Shadows.soft }}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 420, damping: 35 }}
          className="absolute top-1 bottom-1 w-[calc(50%-2px)] rounded-full"
          style={{
            left: activeMode === UserRole.DRIVER ? "calc(50% + 1px)" : "4px",
            background: Colors.card,
            boxShadow: Shadows.medium,
          }}
        />

        <button
          type="button"
          onClick={() => handleSelect(UserRole.USER)}
          className="relative z-10 flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5"
        >
          <User
            size={16}
            style={{
              color: activeMode === UserRole.USER ? Colors.brand.primary : Colors.text.secondary,
            }}
          />
          <span
            className="text-sm font-medium"
            style={{
              color: activeMode === UserRole.USER ? Colors.brand.primary : Colors.text.secondary,
            }}
          >
            Passageiro
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect(UserRole.DRIVER)}
          className="relative z-10 flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5"
        >
          <Car
            size={16}
            style={{
              color: activeMode === UserRole.DRIVER ? Colors.brand.primary : Colors.text.secondary,
            }}
          />
          <span
            className="text-sm font-medium"
            style={{
              color: activeMode === UserRole.DRIVER ? Colors.brand.primary : Colors.text.secondary,
            }}
          >
            Motorista
          </span>
        </button>
      </div>
    </div>
  );
}
