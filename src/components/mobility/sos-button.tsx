import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import type { RideStatusValue } from "@/lib/mobility/ride-types";
import { canShare } from "@/lib/mobility/ride-status";

interface SosButtonProps {
  status: RideStatusValue;
  onSOS: () => void;
}

export function SosButton({ status, onSOS }: SosButtonProps) {
  if (!canShare(status)) return null;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onSOS}
      className="h-11 w-11 grid place-items-center rounded-full bg-destructive text-white shadow-elegant"
      aria-label="Emergência SOS"
    >
      <Shield className="h-5 w-5" />
    </motion.button>
  );
}
