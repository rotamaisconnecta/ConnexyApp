import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Lock } from "lucide-react";

import { UserRole } from "@/lib/roles/roles-types";
import { getRoleDefinition } from "@/lib/roles/roles-utils";
import { BrandCard } from "@/components/ui/brand-card";
import { BrandBadge } from "@/components/ui/brand-badge";
import { BrandButton } from "@/components/ui/brand-button";

const CRIAR_LABELS: Partial<Record<UserRole, string>> = {
  [UserRole.BUSINESS]: "Criar Negócio",
  [UserRole.EVENT_CREATOR]: "Criar Evento",
  [UserRole.PLACE_OWNER]: "Criar Local",
  [UserRole.DRIVER]: "Começar a Dirigir",
  [UserRole.REELS_CREATOR]: "Criar Reel",
};

interface RoleCardProps {
  role: UserRole;
  title?: string;
  description?: string;
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
  const def = getRoleDefinition(role);
  if (!def) return null;

  const isUser = role === UserRole.USER;
  const displayTitle = title ?? def.label;
  const displayDescription = description ?? def.description;
  const criarLabel = CRIAR_LABELS[role] ?? "Criar";

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
    >
      <BrandCard
        shadow={active ? "medium" : "soft"}
        className={[
          "relative overflow-hidden transition-all duration-200",
          active ? "ring-2 ring-primary/20" : "hover:shadow-medium",
        ].join(" ")}
        onClick={isUser ? undefined : onClick}
      >
        {active && (
          <div className="absolute top-0 left-0 h-1 w-full" style={{ background: def.color }} />
        )}

        <div className="flex items-start justify-between">
          <BrandBadge variant={active ? "success" : "default"}>
            <span className="leading-none">{def.emoji}</span>
            <span>{displayTitle}</span>
          </BrandBadge>

          {isUser ? (
            <Lock size={16} className="text-muted-foreground shrink-0 mt-0.5" />
          ) : active ? (
            <CheckCircle2 size={20} className="text-success shrink-0 mt-0.5" />
          ) : (
            <ArrowRight size={18} className="text-muted-foreground shrink-0 mt-0.5" />
          )}
        </div>

        <p className="mt-3 text-sm leading-5 text-muted-foreground">{displayDescription}</p>

        <div className="mt-4">
          {isUser ? (
            <BrandBadge variant="default" className="text-[10px]">
              Sempre ativo
            </BrandBadge>
          ) : (
            <BrandButton variant="primary" size="sm" className="w-full">
              {active ? "Gerenciar" : criarLabel}
            </BrandButton>
          )}
        </div>
      </BrandCard>
    </motion.div>
  );
}
