import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { sheetItem } from "./navigation-animations";
import { Colors, Shadows } from "@/theme";

interface CreateSheetItemProps {
  categoryId: string;
  emoji: string;
  label: string;
  description: string;
  index: number;
  enabled?: boolean;
  lockedReason?: string | null;
  onSelect?: (category: string) => void;
  onLocked?: (categoryId: string) => void;
}

export function CreateSheetItem({
  categoryId,
  emoji,
  label,
  description,
  index,
  enabled = true,
  lockedReason,
  onSelect,
  onLocked,
}: CreateSheetItemProps) {
  const isLocked = !enabled && !!lockedReason;

  function handleClick() {
    if (isLocked) {
      onLocked?.(categoryId);
    } else {
      onSelect?.(categoryId);
    }
  }

  return (
    <motion.button
      custom={index}
      variants={sheetItem}
      initial="hidden"
      animate="visible"
      whileTap={{ scale: isLocked ? 0.97 : 0.95 }}
      whileHover={{ scale: isLocked ? 1.0 : 1.03 }}
      onClick={handleClick}
      aria-label={`Criar ${label}`}
      className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-primary/50 relative"
      style={{
        background: Colors.surface,
        boxShadow: Shadows.soft,
        opacity: isLocked ? 0.55 : 1,
      }}
    >
      <div
        className="h-14 w-14 sm:h-16 sm:w-16 rounded-full grid place-items-center text-2xl sm:text-3xl relative"
        style={{ background: Colors.card, boxShadow: Shadows.soft }}
      >
        {emoji}
        {isLocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: index * 0.04 + 0.2 }}
            className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full grid place-items-center"
            style={{ background: Colors.brand.primary }}
          >
            <Lock size={10} className="text-white" />
          </motion.div>
        )}
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold leading-tight" style={{ color: Colors.text.primary }}>
          {label}
        </div>
        {isLocked ? (
          <div
            className="text-[10px] mt-0.5 leading-tight line-clamp-2"
            style={{ color: Colors.text.secondary }}
          >
            {lockedReason}
          </div>
        ) : (
          <div
            className="text-[10px] mt-0.5 leading-tight"
            style={{ color: Colors.text.secondary }}
          >
            {description}
          </div>
        )}
      </div>
      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 + 0.3 }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white"
          style={{ background: Colors.brand.primary }}
        >
          <Lock size={8} />
          Ativar
        </motion.div>
      )}
    </motion.button>
  );
}
