import { motion } from "framer-motion";

import { UserRole } from "@/lib/roles/roles-types";
import { getRoleDefinition } from "@/lib/roles/roles-utils";
import { BrandBadge } from "@/components/ui/brand-badge";

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md" | "lg";
  outlined?: boolean;
}

const variantMap: Record<UserRole, "default" | "success" | "warning" | "danger" | "premium"> = {
  USER: "default",
  DRIVER: "success",
  BUSINESS: "warning",
  EVENT_CREATOR: "danger",
  PLACE_OWNER: "default",
  REELS_CREATOR: "premium",
};

const sizeClassMap: Record<NonNullable<RoleBadgeProps["size"]>, string> = {
  sm: "text-[10px] px-2 py-0.5",
  md: "text-xs px-3 py-1",
  lg: "text-sm px-4 py-1.5",
};

export default function RoleBadge({ role, size = "md", outlined = false }: RoleBadgeProps) {
  const def = getRoleDefinition(role);
  if (!def) return null;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="inline-flex"
    >
      <BrandBadge variant={outlined ? "default" : variantMap[role]} className={sizeClassMap[size]}>
        <span className="leading-none">{def.emoji}</span>
        <span>{def.label}</span>
      </BrandBadge>
    </motion.div>
  );
}
