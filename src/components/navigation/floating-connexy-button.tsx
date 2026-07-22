import { motion } from "framer-motion";

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
        className="relative h-[68px] w-[68px] rounded-full bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-[#A855F7] shadow-xl flex items-center justify-center z-10 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-[#A855F7] blur-xl opacity-40 animate-pulse" />
        <svg viewBox="0 0 120 120" className="relative h-[42px] w-[42px]" aria-hidden="true">
          <circle cx="60" cy="60" r="56" fill="white" fillOpacity="0.15" />
          <text
            x="60"
            y="68"
            textAnchor="middle"
            fill="white"
            fontSize="32"
            fontWeight="800"
            fontFamily="system-ui, sans-serif"
          >
            C
          </text>
        </svg>
      </motion.button>
    </li>
  );
}
