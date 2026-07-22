import { motion } from "framer-motion";

interface LoadingRideProps {
  message?: string;
}

export function LoadingRide({ message = "Buscando motoristas…" }: LoadingRideProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary"
      />
      <p className="mt-4 font-semibold text-sm">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground">Encontrando as melhores opções para você</p>
    </div>
  );
}
