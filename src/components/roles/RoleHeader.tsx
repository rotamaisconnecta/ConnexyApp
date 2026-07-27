import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface RoleHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function RoleHeader({
  title = "ATIVAR FUNCIONALIDADES",
  subtitle = "Escolha quais recursos deseja utilizar no Connexy.",
}: RoleHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-lg">
          <ShieldCheck size={24} className="text-white" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}
