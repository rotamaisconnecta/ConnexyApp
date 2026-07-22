import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Colors, Radius } from "@/lib/branding/brand-config";

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "SM" | "MD" | "LG";
  icon?: React.ComponentType<{ className?: string }>;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const sizeClassMap: Record<NonNullable<ChipProps["size"]>, string> = {
  SM: "h-7 text-xs px-3",
  MD: "h-8 text-sm px-3.5",
  LG: "h-10 text-base px-4",
};

export function Chip({
  label,
  selected = false,
  onClick,
  size = "MD",
  icon: Icon,
  removable = false,
  onRemove,
  className,
}: ChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
        sizeClassMap[size],
        className,
      )}
      style={{
        background: selected ? Colors.brand.primary : Colors.surface,
        color: selected ? "#FFFFFF" : Colors.brand.primary,
        borderRadius: Radius.floating,
      }}
    >
      {Icon && (
        <span className="flex items-center">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <span>{label}</span>
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 rounded-full p-0.5 transition-colors"
          style={{ color: selected ? "#FFFFFFCC" : Colors.brand.primary }}
        >
          <span className="flex items-center">
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </span>
        </button>
      )}
    </motion.button>
  );
}
