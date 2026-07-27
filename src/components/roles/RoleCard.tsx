import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";

import RoleBadge from "./RoleBadge";

import { UserRole } from "@/lib/roles/roles-types";

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  active?: boolean;
  onClick?: () => void;
}

export default function RoleCard({
  role,
  title,
  description,
  active = false,
  onClick,
}: RoleCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      className={[
        "w-full",
        "rounded-3xl",
        "border",
        "p-5",
        "text-left",
        "transition-all",
        active
          ? "border-violet-500 bg-violet-50 shadow-lg"
          : "border-border bg-card hover:border-violet-300 hover:shadow-md",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <RoleBadge role={role} size="md" />
        {active ? (
          <CheckCircle2 size={24} className="text-violet-600" />
        ) : (
          <ArrowRight size={20} className="text-muted-foreground" />
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="mt-6">
        {active ? (
          <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Ativado
          </div>
        ) : (
          <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Disponível
          </div>
        )}
      </div>
    </motion.button>
  );
}
