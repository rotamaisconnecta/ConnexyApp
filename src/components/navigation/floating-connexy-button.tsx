import { motion } from "framer-motion";
import Icon from "@/assets/connexy-icon.png";

interface FloatingConnexyButtonProps {
  onTap?: () => void;
}

export function FloatingConnexyButton({ onTap }: FloatingConnexyButtonProps) {
  return (
    <li className="flex-1 flex justify-center -mt-6">
      <motion.button
        onClick={onTap}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300, delay: 0.1 }}
        aria-label="Criar publicação"
        className="relative h-[68px] w-[68px] rounded-full bg-gradient-to-br from-[#6C3BFF] to-[#8B5CFF] shadow-xl ring-4 ring-background flex items-center justify-center z-10 outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <img
          src={Icon}
          alt="Connexy"
          className="h-[46px] w-[46px] object-contain select-none pointer-events-none drop-shadow-md"
        />
      </motion.button>
    </li>
  );
}
