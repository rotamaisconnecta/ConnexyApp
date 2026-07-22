import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { scaleIn } from "@/lib/system/animation-utils";
import { Colors, Radius, Shadows } from "@/lib/branding/brand-config";
import type { ContextMenuItem } from "@/lib/system/system-types";
import type { ReactNode } from "react";

interface ContextMenuProps {
  trigger: ReactNode;
  items: ContextMenuItem[];
  onSelect: (id: string) => void;
  className?: string;
}

export function ContextMenu({ trigger, items, onSelect, className }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    function handleScroll() {
      setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  function handleSelect(id: string) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)} onContextMenu={handleContextMenu}>
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={scaleIn.initial}
            animate={scaleIn.animate}
            exit={scaleIn.exit}
            transition={scaleIn.transition}
            className="absolute z-50 min-w-[180px]"
            style={{
              left: position.x,
              top: position.y,
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
