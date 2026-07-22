import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Colors, Radius } from "@/lib/branding/brand-config";
import type { TabItem } from "@/lib/system/system-types";

interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn("flex overflow-x-auto scrollbar-none", className)}
      style={{
        borderBottom: `1px solid ${Colors.border}`,
      }}
    >
      {items.map((item) => {
        const isActive = item.id === activeTab;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            disabled={item.disabled}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            style={{
              color: isActive ? Colors.brand.primary : Colors.text.secondary,
            }}
          >
            {Icon && (
              <span className="flex items-center">
                <Icon className="h-4 w-4" />
              </span>
            )}
            {item.label}
            {isActive && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: 2,
                  borderRadius: Radius.floating,
                  background: Colors.brand.primary,
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
