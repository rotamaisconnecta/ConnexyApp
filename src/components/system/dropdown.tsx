import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { scaleIn } from "@/lib/system/animation-utils";
import { Colors, Radius, Shadows } from "@/lib/branding/brand-config";
import type { DropdownItem } from "@/lib/system/system-types";

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (id: string) => void;
  className?: string;
}

export function Dropdown({ trigger, items, onSelect, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelect(id: string) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)}>
      <div onClick={() => setOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={scaleIn.initial}
            animate={scaleIn.animate}
            exit={scaleIn.exit}
            transition={scaleIn.transition}
            className="absolute top-full left-0 mt-2 z-50 min-w-[180px]"
            style={{
              background: Colors.background,
              borderRadius: Radius.md,
              border: `1px solid ${Colors.border}`,
              boxShadow: Shadows.large,
              padding: 4,
            }}
          >
            {items.map((item) => {
              const IconComponent = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  disabled={item.disabled}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors",
                    item.disabled && "opacity-40 cursor-not-allowed",
                    item.destructive ? "hover:bg-red-50 text-red-600" : "hover:bg-gray-50",
                  )}
                  style={{
                    borderRadius: Radius.sm,
                    color: item.destructive ? Colors.danger : Colors.text.primary,
                  }}
                >
                  {IconComponent && (
                    <span
                      className="flex-shrink-0"
                      style={{
                        color: item.destructive ? Colors.danger : Colors.text.secondary,
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </span>
                  )}
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
