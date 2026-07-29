import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

import { Colors, Gradients, Radius, Shadows } from "@/theme";

interface RoleHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function RoleHeader({
  title = "MEU CONNEXY",
  subtitle = "Crie e gerencie seus negócios, eventos e locais.",
}: RoleHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mb-5"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center shrink-0"
          style={{
            borderRadius: Radius.md,
            background: Gradients.primary,
            boxShadow: Shadows.floatingButton,
          }}
        >
          <ShieldCheck size={22} className="text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <h2 className="text-lg font-bold leading-tight" style={{ color: Colors.text.primary }}>
            {title}
          </h2>
          <p className="text-sm mt-0.5 leading-snug" style={{ color: Colors.text.secondary }}>
            {subtitle}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
