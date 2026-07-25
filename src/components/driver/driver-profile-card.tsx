/* ==== driver-profile-card.tsx -- Premium driver card for profile page ==== */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Car,
  ChevronRight,
  LayoutDashboard,
  Wallet,
  Clock,
  BarChart3,
  CarFront,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { driverSection, cardHover, buttonTap } from "./driver-animations";
import { DriverModeSwitch } from "./driver-mode-switch";

/* ==== Props ==== */

interface DriverProfileCardProps {
  hasRegistration: boolean;
  isOnline: boolean;
  mode: "user" | "driver";
  onModeChange: (mode: "user" | "driver") => void;
}

/* ==== Not registered view ==== */

function NotRegisteredCard() {
  return (
    <motion.div
      variants={driverSection(0)}
      initial="hidden"
      animate="visible"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft"
    >
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Car className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">Motorista</h3>
            <p className="text-[11px] text-muted-foreground">Ganhe dinheiro fazendo viagens</p>
          </div>
        </div>

        <Link
          to="/driver/cadastro"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-2.5 text-xs font-semibold text-white shadow-soft"
          {...buttonTap}
        >
          <Car className="h-3.5 w-3.5" />
          Cadastrar-se
        </Link>
      </div>
    </motion.div>
  );
}

/* ==== Registered view ==== */

function RegisteredCard({
  isOnline,
  mode,
  onModeChange,
}: {
  isOnline: boolean;
  mode: "user" | "driver";
  onModeChange: (mode: "user" | "driver") => void;
}) {
  const actions = [
    { label: "Painel", icon: LayoutDashboard, to: "/driver" },
    { label: "Financeiro", icon: Wallet, to: "/driver/finance" },
    { label: "Histórico", icon: Clock, to: "/driver/history" },
    { label: "Performance", icon: BarChart3, to: "/driver/performance" },
    { label: "Veículo", icon: CarFront, to: "/driver/profile" },
  ];

  return (
    <motion.div
      variants={driverSection(0)}
      initial="hidden"
      animate="visible"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft"
    >
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Car className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">Motorista</h3>
            <div className="flex items-center gap-1.5">
              <span
                className={cn("h-2 w-2 rounded-full", isOnline ? "bg-green-500" : "bg-red-500")}
              />
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isOnline ? "text-green-600" : "text-red-500",
                )}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <DriverModeSwitch mode={mode} onModeChange={onModeChange} size="sm" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-5 gap-1 p-3 pt-2">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex flex-col items-center gap-1 rounded-xl py-2 transition-colors hover:bg-muted"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <action.icon className="h-4 w-4" />
            </div>
            <span className="text-[9px] font-medium text-muted-foreground">{action.label}</span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

/* ==== Main component ==== */

export function DriverProfileCard({
  hasRegistration,
  isOnline,
  mode,
  onModeChange,
}: DriverProfileCardProps) {
  if (!hasRegistration) {
    return <NotRegisteredCard />;
  }

  return <RegisteredCard isOnline={isOnline} mode={mode} onModeChange={onModeChange} />;
}
