import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Colors, Radius, Gradients } from "@/lib/branding/brand-config";

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  title?: string;
  distance?: string;
  markerLabel?: string;
  className?: string;
}

export function MapPreview({
  latitude,
  longitude,
  title,
  distance,
  markerLabel,
  className,
}: MapPreviewProps) {
  return (
    <motion.div
      className={cn("flex flex-col overflow-hidden", className)}
      style={{ borderRadius: Radius.md }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="relative flex items-center justify-center w-full aspect-[4/3]"
        style={{ background: Gradients.soft }}
      >
        <div className="absolute inset-0" style={{ background: Gradients.soft }} />
        <div className="relative flex flex-col items-center gap-1">
          <MapPin className="w-8 h-8" style={{ color: Colors.brand.primary }} />
          {markerLabel && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: Colors.brand.primary,
                color: "#FFFFFF",
                borderRadius: Radius.floating,
              }}
            >
              {markerLabel}
            </span>
          )}
        </div>
      </div>
      {(title || distance) && (
        <div className="px-3 py-2" style={{ backgroundColor: Colors.card }}>
          {title && (
            <p className="text-sm font-semibold truncate" style={{ color: Colors.text.primary }}>
              {title}
            </p>
          )}
          {distance && (
            <p className="text-xs" style={{ color: Colors.text.secondary }}>
              {distance}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
