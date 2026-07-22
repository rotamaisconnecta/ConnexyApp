import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Colors, Radius } from "@/lib/branding/brand-config";

interface LoadingMapProps {
  className?: string;
}

export function LoadingMap({ className }: LoadingMapProps) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      style={{
        borderRadius: Radius.md,
        backgroundColor: Colors.surface,
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <MapPin size={48} strokeWidth={1.5} style={{ color: Colors.brand.primary }} />
      </motion.div>
    </div>
  );
}
