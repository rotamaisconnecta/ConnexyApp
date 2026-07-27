import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface RoleGridProps {
  children: ReactNode;
}

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export default function RoleGrid({ children }: RoleGridProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full"
    >
      {children}
    </motion.div>
  );
}
