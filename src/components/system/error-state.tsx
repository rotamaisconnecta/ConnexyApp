import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Colors, Animations } from "@/lib/branding/brand-config";
import { BrandButton } from "@/components/ui/brand-button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Algo deu errado",
  message,
  onRetry,
  retryLabel = "Tentar novamente",
  className,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={Animations.fade.initial}
      animate={Animations.fade.animate}
      exit={Animations.fade.exit}
      transition={Animations.fade.transition}
      className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}
    >
      <span className="flex items-center justify-center w-16 h-16 rounded-full mb-6 bg-red-50">
        <AlertCircle className="w-8 h-8" style={{ color: Colors.danger }} />
      </span>

      <h2 className="text-xl font-bold mb-2" style={{ color: Colors.text.primary }}>
        {title}
      </h2>

      {message && (
        <p className="text-sm max-w-xs mb-6" style={{ color: Colors.text.secondary }}>
          {message}
        </p>
      )}

      {onRetry && (
        <BrandButton onClick={onRetry} variant="primary" size="md">
          {retryLabel}
        </BrandButton>
      )}
    </motion.div>
  );
}
