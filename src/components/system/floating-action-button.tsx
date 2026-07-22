import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
        "bg-gradient-to-r from-[#6C3BFF] to-[#8B5CFF] text-white",
        "shadow-[0_8px_24px_rgba(108,59,255,0.35)]",
        "transition-shadow hover:shadow-[0_12px_32px_rgba(108,59,255,0.45)]",
        size === "md" && "h-14 w-14",
        size === "lg" && "h-16 w-16",
        className,
      )}
      aria-label={label}
    >
      {Icon && <Icon className="w-6 h-6 text-white" />}
    </motion.button>
  );
}
