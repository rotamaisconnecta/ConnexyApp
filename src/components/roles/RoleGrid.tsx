import { motion } from "framer-motion";
import { ReactNode } from "react";

interface RoleGridProps {
  children: ReactNode;
}

export default function RoleGrid({ children }: RoleGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full"
    >
      {children}
    </motion.div>
  );
}
