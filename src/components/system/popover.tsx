import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { scaleIn } from "@/lib/system/animation-utils";
import { Colors, Radius, Shadows } from "@/lib/branding/brand-config";
import type { ReactNode } from "react";

const alignMap: Record<string, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

const sideMap: Record<string, string> = {
  top: "bottom-full mb-2",
  bottom: "top-full mt-2",
};

interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  side?: "top" | "bottom";
  className?: string;
  align?: "start" | "center" | "end";
}

export function Popover({
  trigger,
  content,
  side = "bottom",
  className,
  align = "start",
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

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
            className={cn("absolute z-50 min-w-[180px]", sideMap[side], alignMap[align])}
            style={{
              background: Colors.background,
              borderRadius: Radius.md,
              border: `1px solid ${Colors.border}`,
              boxShadow: Shadows.large,
              padding: 8,
            }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
