import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Colors, Gradients, Radius, Shadows } from "@/theme";

interface FloatingActionButtonProps {
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  onClick?: () => void;
  size?: "md" | "lg";
  className?: string;
}

export function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
  size = "md",
  className,
}: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full",
        "text-white",
        "transition-shadow",
        size === "md" && "h-14 w-14",
        size === "lg" && "h-16 w-16",
        className,
      )}
      style={{
        background: Gradients.primary,
        borderRadius: Radius.floating,
        boxShadow: Shadows.floatingButton,
      }}
      aria-label={label}
    >
      {Icon && <Icon className="w-6 h-6 text-white" />}
    </motion.button>
  );
}
