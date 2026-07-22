import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeIn } from "@/lib/system/animation-utils";
import { Colors, Radius, Shadows } from "@/lib/branding/brand-config";
import type { ReactNode } from "react";

const sideOffset: Record<string, { anchor: string; translate: string }> = {
  top: { anchor: "bottom-full left-1/2 -translate-x-1/2 mb-2", translate: "translate-y-1" },
  bottom: { anchor: "top-full left-1/2 -translate-x-1/2 mt-2", translate: "-translate-y-1" },
  left: { anchor: "right-full top-1/2 -translate-y-1/2 mr-2", translate: "translate-x-1" },
  right: { anchor: "left-full top-1/2 -translate-y-1/2 ml-2", translate: "-translate-x-1" },
};

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const offset = sideOffset[side];

  return (
    <div
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            exit={fadeIn.exit}
            transition={fadeIn.transition}
            className={cn("absolute z-50 whitespace-nowrap pointer-events-none", offset.anchor)}
            style={{
              background: Colors.text.primary,
              color: Colors.background,
              borderRadius: Radius.sm,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 500,
              boxShadow: Shadows.medium,
            }}
          >
            {content}
            <span
              className={cn("absolute w-2 h-2 rotate-45", offset.translate)}
              style={{
                background: Colors.text.primary,
                ...(side === "top" && { bottom: -4, left: "50%", marginLeft: -4 }),
                ...(side === "bottom" && { top: -4, left: "50%", marginLeft: -4 }),
                ...(side === "left" && { right: -4, top: "50%", marginTop: -4 }),
                ...(side === "right" && { left: -4, top: "50%", marginTop: -4 }),
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
