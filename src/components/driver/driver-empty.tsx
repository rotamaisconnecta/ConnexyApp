import { motion } from "framer-motion";

interface DriverEmptyProps {
  message?: string;
  icon?: string;
}

export function DriverEmpty({
  message = "Nenhuma corrida disponível",
  icon = "🚖",
}: DriverEmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <span className="text-5xl mb-4">{icon}</span>
      <p className="text-sm font-semibold text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground mt-1">Fique online para receber solicitações</p>
    </motion.div>
  );
}
