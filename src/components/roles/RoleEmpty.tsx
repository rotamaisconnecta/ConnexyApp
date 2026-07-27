import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { BrandButton } from "@/components/ui/brand-button";
import { Colors, Radius, Shadows } from "@/theme";

interface RoleEmptyProps {
  onActivate?: () => void;
}

export function RoleEmpty({ onActivate }: RoleEmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center gap-4 py-10 text-center"
    >
      <div
        className="w-16 h-16 grid place-items-center"
        style={{
          borderRadius: Radius.lg,
          background: `${Colors.brand.primary}10`,
          boxShadow: Shadows.soft,
        }}
      >
        <Sparkles className="h-7 w-7" style={{ color: Colors.brand.primary }} />
      </div>

      <div className="max-w-[260px]">
        <p className="text-sm font-semibold" style={{ color: Colors.text.primary }}>
          Nenhuma funcionalidade adicional ativa.
        </p>
        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: Colors.text.secondary }}>
          Ative funcionalidades como Motorista, Empresa ou Organizador para desbloquear mais
          recursos.
        </p>
      </div>

      {onActivate && (
        <BrandButton variant="primary" size="sm" onClick={onActivate}>
          Ativar funcionalidades
        </BrandButton>
      )}
    </motion.div>
  );
}
