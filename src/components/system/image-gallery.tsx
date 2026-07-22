import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Radius } from "@/lib/branding/brand-config";

interface ImageItem {
  id: string;
  src: string;
  alt?: string;
}

interface ImageGalleryProps {
  images: ImageItem[];
  onImagePress?: (index: number) => void;
  className?: string;
}

export function ImageGallery({ images, onImagePress, className }: ImageGalleryProps) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-1 overflow-hidden", className)}
      style={{ borderRadius: Radius.md }}
    >
      {images.map((image, index) => (
        <motion.button
          key={image.id}
          onClick={() => onImagePress?.(index)}
          whileTap={{ scale: 0.97 }}
          className="aspect-square overflow-hidden"
          style={{ borderRadius: 0 }}
        >
          <img
            src={image.src}
            alt={image.alt ?? ""}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </motion.button>
      ))}
    </div>
  );
}
