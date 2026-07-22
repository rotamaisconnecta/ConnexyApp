import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Colors, Radius, Shadows } from "@/lib/branding/brand-config";

interface SegmentedControlOption {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div
      className={cn("flex rounded-full p-1", className)}
      style={{
        background: Colors.surface,
      }}
    >
      {options.map((option) => {
        const isActive = option.id === value;

        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative z-10 flex-1 px-4 py-2 text-sm font-medium transition-colors rounded-full",
            )}
            style={{
              color: isActive ? Colors.text.primary : Colors.text.secondary,
            }}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-bg"
                className="absolute inset-0 rounded-full"
                style={{
                  background: Colors.brand.primary,
                  boxShadow: Shadows.soft,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
