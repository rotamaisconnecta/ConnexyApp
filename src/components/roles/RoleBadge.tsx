import { motion } from "framer-motion";
import {
  Car,
  Store,
  CalendarDays,
  MapPin,
  Clapperboard,
  User,
} from "lucide-react";

import { UserRole } from "@/lib/roles/roles-types";

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md" | "lg";
  outlined?: boolean;
}

const roleConfig = {
  USER: {
    label: "Usuário",
    icon: User,
    color: "bg-slate-100",
    text: "text-slate-700",
  },
  DRIVER: {
    label: "Motorista",
    icon: Car,
    color: "bg-violet-100",
    text: "text-violet-700",
  },
  BUSINESS: {
    label: "Empresa",
    icon: Store,
    color: "bg-emerald-100",
    text: "text-emerald-700",
  },
  EVENT_CREATOR: {
    label: "Eventos",
    icon: CalendarDays,
    color: "bg-orange-100",
    text: "text-orange-700",
  },
  PLACE_OWNER: {
    label: "Local",
    icon: MapPin,
    color: "bg-sky-100",
    text: "text-sky-700",
  },
  REELS_CREATOR: {
    label: "Creator",
    icon: Clapperboard,
    color: "bg-pink-100",
    text: "text-pink-700",
  },
};

const sizeClasses = {
  sm: {
    wrapper: "px-2 py-1 text-xs gap-1",
    icon: 12,
  },
  md: {
    wrapper: "px-3 py-1.5 text-sm gap-2",
    icon: 16,
  },
  lg: {
    wrapper: "px-4 py-2 text-base gap-2",
    icon: 18,
  },
};

export default function RoleBadge({
  role,
  size = "md",
  outlined = false,
}: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;
  const current = sizeClasses[size];

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={[
        "inline-flex items-center rounded-full font-semibold transition-all duration-200",
        current.wrapper,
        outlined ? "border border-current bg-transparent" : config.color,
        config.text,
      ].join(" ")}
    >
      <Icon size={current.icon} />
      <span>{config.label}</span>
    </motion.div>
  );
}
