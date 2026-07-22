import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Colors, Animations } from "@/lib/branding/brand-config";

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  type?: "image" | "video";
  alt?: string;
}

export function MediaViewer({ isOpen, onClose, src, type = "image", alt = "" }: MediaViewerProps) {
  const [scale, setScale] = useState(1);

  const handleToggleZoom = useCallback(() => {
    setScale((prev) => (prev === 1 ? 2 : 1));
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={Animations.fade.initial}
          animate={Animations.fade.animate}
          exit={Animations.fade.exit}
          transition={Animations.fade.transition}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            aria-label="Close"
          >
            <span style={{ color: "#FFFFFF" }}>
              <X className="w-6 h-6" />
            </span>
          </button>
          <motion.div
            className="w-full h-full flex items-center justify-center p-4"
            onClick={handleToggleZoom}
            style={{ cursor: "zoom-in" }}
          >
            {type === "video" ? (
              <video
                src={src}
                className="max-w-full max-h-full object-contain"
                controls
                playsInline
                style={{
                  transform: `scale(${scale})`,
                  transition: "transform 0.3s ease",
                }}
              />
            ) : (
              <img
                src={src}
                alt={alt}
                className={cn("max-w-full max-h-full object-contain")}
                style={{
                  transform: `scale(${scale})`,
                  transition: "transform 0.3s ease",
                }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
