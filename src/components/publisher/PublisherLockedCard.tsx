import { motion } from "framer-motion";
import { Lock } from "lucide-react";

import { Colors, Radius, Shadows } from "@/theme";

interface PublisherLockedCardProps {
  emoji: string;
  title: string;
  lockedReason: string;
  onActivate?: () => void;
}

export default function PublisherLockedCard({
  emoji,
  title,
  lockedReason,
  onActivate,
}: PublisherLockedCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col items-center gap-2 p-3 rounded-2xl outline-none"
      style={{
        background: Colors.surface,
        boxShadow: Shadows.soft,
        opacity: 0.55,
      }}
    >
      <div
        className="h-14 w-14 sm:h-16 sm:w-16 rounded-full grid place-items-center text-2xl sm:text-3xl relative"
        style={{ background: Colors.card, boxShadow: Shadows.soft }}
      >
        {emoji}
        <div
          className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full grid place-items-center"
          style={{ background: Colors.brand.primary }}
        >
          <Lock size={10} className="text-white" />
        </div>
      </div>

      <div className="text-center">
        <div className="text-xs font-semibold leading-tight" style={{ color: Colors.text.primary }}>
          {title}
        </div>
        <div
          className="text-[10px] mt-0.5 leading-tight line-clamp-2"
          style={{ color: Colors.text.secondary }}
        >
          {lockedReason}
        </div>
      </div>

      {onActivate && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onActivate();
          }}
          className="mt-1 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white"
          style={{ background: Colors.brand.primary }}
        >
          <Lock size={8} />
          Ativar
        </motion.button>
      )}
    </motion.div>
  );
}
