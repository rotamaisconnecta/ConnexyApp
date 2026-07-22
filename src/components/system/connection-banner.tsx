import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Colors, Animations } from "@/lib/branding/brand-config";

interface ConnectionBannerProps {
  isOnline: boolean;
  className?: string;
}

export function ConnectionBanner({ isOnline, className }: ConnectionBannerProps) {
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={Animations.slideDown.initial}
          animate={Animations.slideDown.animate}
          exit={Animations.slideDown.exit}
          transition={Animations.slideDown.transition}
          className={cn(
            "w-full flex items-center justify-center py-2 px-4 text-sm font-semibold",
            className,
          )}
          style={{ backgroundColor: Colors.danger, color: Colors.background }}
        >
          Sem conexão
        </motion.div>
      )}
    </AnimatePresence>
  );
}
