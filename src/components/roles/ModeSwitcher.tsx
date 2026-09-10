import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Car, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Colors, Shadows } from "@/theme";
import { setActiveMode } from "@/lib/roles/roles-storage";
import { UserRole, type RoleMode } from "@/lib/roles/roles-types";
import { useDriverMode, switchToPassengerMode } from "@/hooks/use-driver-mode";

export default function ModeSwitcher() {
  const navigate = useNavigate();
  const { approved, hasDriverRole, isDriverMode, driverStatus } = useDriverMode();
  const canDrive = hasDriverRole && approved;

  useEffect(() => {
    if (!isDriverMode || canDrive) return;
    setActiveMode(UserRole.USER);
    window.dispatchEvent(new Event("roleChanged"));
  }, [isDriverMode, canDrive]);

  function handleSelect(mode: RoleMode) {
    if (mode === UserRole.DRIVER && !canDrive) {
      navigate({ to: "/driver/cadastro" });
      return;
    }

    if (mode === UserRole.USER && isDriverMode) {
      if (!switchToPassengerMode()) {
        toast.error("Corrida ativa", {
          description: "Conclua ou cancele a corrida antes de trocar o modo.",
        });
        return;
      }
    } else {
      setActiveMode(mode);
      window.dispatchEvent(new Event("roleChanged"));
    }

    const isDriverModeSelected = mode === UserRole.DRIVER;
    const title = isDriverModeSelected ? "🚗 Modo Motorista ativado" : "🚶 Modo Passageiro ativado";
    const description = isDriverModeSelected
      ? "Agora você está utilizando o painel do motorista."
      : "Agora você voltou ao modo passageiro.";

    toast.success(title, {
      description,
      duration: 2000,
      className:
        "border border-border bg-background/95 text-foreground shadow-2xl backdrop-blur-xl",
    });

    window.setTimeout(() => {
      navigate({ to: isDriverModeSelected ? "/driver" : "/home" });
    }, 300);
  }

  if (!canDrive) {
    return (
      <div className="mx-4 mt-3 rounded-[24px] border border-border bg-surface p-2 shadow-soft">
        <button
          type="button"
          onClick={() => navigate({ to: "/driver/cadastro" })}
          className="flex w-full items-center justify-between rounded-full bg-amber-50 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FFC107] text-black">
              <Car className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">
                {driverStatus === "pending" ? "Cadastro em análise" : "Tornar-me Motorista"}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {driverStatus === "pending"
                  ? "Aguardando aprovação da equipe técnica"
                  : driverStatus === "rejected"
                    ? "Revise seu cadastro para continuar"
                    : "Cadastre-se para receber solicitações"}
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <motion.div
      key={isDriverMode ? "driver" : "passenger"}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-4 mt-3 rounded-[24px] border border-border bg-surface p-2 shadow-soft"
    >
      <div
        className="relative flex items-center rounded-full p-1"
        style={{ background: Colors.surface, boxShadow: Shadows.soft }}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 420, damping: 35 }}
          className="absolute top-1 bottom-1 w-[calc(50%-2px)] rounded-full"
          style={{
            left: isDriverMode ? "calc(50% + 1px)" : "4px",
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
            style={{ color: isDriverMode ? Colors.text.secondary : Colors.brand.primary }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: isDriverMode ? Colors.text.secondary : Colors.brand.primary }}
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
            style={{ color: isDriverMode ? Colors.brand.primary : Colors.text.secondary }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: isDriverMode ? Colors.brand.primary : Colors.text.secondary }}
          >
            Motorista
          </span>
        </button>
      </div>
    </motion.div>
  );
}
