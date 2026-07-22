import { motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Colors, Animations } from "@/lib/branding/brand-config";
import { BrandButton } from "@/components/ui/brand-button";
import { useOffline } from "@/hooks/system/use-offline";

interface OfflineStateProps {
  onRetry?: () => void;
  className?: string;
}

export function OfflineState({ onRetry, className }: OfflineStateProps) {
  const { retry: defaultRetry } = useOffline();

  const handleRetry = onRetry ?? defaultRetry;

  return (
    <motion.div
      initial={Animations.fade.initial}
      animate={Animations.fade.animate}
      exit={Animations.fade.exit}
      transition={Animations.fade.transition}
      className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}
    >
      <span className="flex items-center justify-center w-16 h-16 rounded-full mb-6 bg-orange-50">
        <WifiOff className="w-8 h-8" style={{ color: Colors.warning }} />
      </span>

      <h2 className="text-xl font-bold mb-2" style={{ color: Colors.text.primary }}>
        Sem conexão
      </h2>

      <p className="text-sm max-w-xs mb-6" style={{ color: Colors.text.secondary }}>
        Verifique sua conexão com a internet e tente novamente.
      </p>

      <BrandButton onClick={handleRetry} variant="primary" size="md">
        Reconectar
      </BrandButton>
    </motion.div>
  );
}
