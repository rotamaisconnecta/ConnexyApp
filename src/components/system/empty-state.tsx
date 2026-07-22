import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Colors, Radius, Animations } from "@/lib/branding/brand-config";
import { BrandButton } from "@/components/ui/brand-button";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={Animations.fade.initial}
      animate={Animations.fade.animate}
      exit={Animations.fade.exit}
      transition={Animations.fade.transition}
      className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}
    >
      {Icon && (
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{ backgroundColor: "#F4F1FF" }}
        >
          <span style={{ color: Colors.brand.primary }}>
            <Icon className="w-8 h-8" />
          </span>
        </div>
      )}

      <h2
        className="text-xl font-bold mb-2"
        style={{ color: Colors.text.primary, borderRadius: Radius.md }}
      >
        {title}
      </h2>

      {description && (
        <p className="text-sm max-w-xs mb-6" style={{ color: Colors.text.secondary }}>
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <BrandButton onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </BrandButton>
      )}
    </motion.div>
  );
}
