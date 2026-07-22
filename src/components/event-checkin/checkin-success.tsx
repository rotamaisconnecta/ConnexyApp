import { useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CheckinSuccessProps {
  eventName: string;
  onClose: () => void;
}

export function CheckinSuccess({ eventName, onClose }: CheckinSuccessProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white p-8 text-center shadow-soft"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.15 }}
        className={cn("flex h-20 w-20 items-center justify-center rounded-full", "bg-emerald-50")}
      >
        <span className="text-5xl" role="img" aria-label="checkmark">
          ✔️
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="font-display text-xl font-bold text-foreground">Check-in realizado!</h3>
        <p className="mt-2 text-sm text-muted-foreground">Você está presente no {eventName}</p>
      </motion.div>
    </motion.div>
  );
}
