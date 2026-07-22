import { motion } from "framer-motion";
import { centerButton } from "./navigation-animations";
import Icon from "@/assets/connexy-icon.png";

interface FloatingPlusButtonProps {
  onTap?: () => void;
}

export function FloatingPlusButton({ onTap }: FloatingPlusButtonProps) {
  return (
    <motion.li variants={centerButton} className="flex-1 flex justify-center -mt-5">
      <motion.button
        onClick={onTap}
        whileTap="tap"
        whileHover="hover"
        variants={centerButton}
        aria-label="Criar publicação"
        className="relative h-16 w-16 rounded-full bg-gradient-to-br from-[#6C3BFF] to-[#8B5CFF] shadow-xl ring-4 ring-background flex items-center justify-center z-10 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 overflow-hidden"
      >
        <img
          src={Icon}
          alt="Connexy"
          className="h-[46px] w-[46px] object-contain select-none pointer-events-none drop-shadow-md"
        />
      </motion.button>
    </motion.li>
  );
}
