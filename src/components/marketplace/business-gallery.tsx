import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { BusinessPhoto } from "@/lib/marketplace/business-types";

interface BusinessGalleryProps {
  photos: BusinessPhoto[];
  onExpand?: (index: number) => void;
}

export function BusinessGallery({ photos, onExpand }: BusinessGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="h-52 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 grid place-items-center text-4xl">
        📷
      </div>
    );
  }

  function handlePrev() {
    setActiveIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }

  function handleNext() {
    setActiveIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }

  return (
    <div className="space-y-2">
      <div className="relative h-52 rounded-2xl overflow-hidden">
        <img
          src={photos[activeIndex].url}
          alt={photos[activeIndex].alt}
          className="h-full w-full object-cover"
        />

        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-full bg-surface/80 backdrop-blur"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Próxima foto"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-full bg-surface/80 backdrop-blur"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        <button
          onClick={() => onExpand?.(activeIndex)}
          aria-label="Expandir foto"
          className="absolute bottom-2 right-2 h-8 w-8 grid place-items-center rounded-full bg-surface/80 backdrop-blur"
        >
          <Expand className="h-4 w-4" />
        </button>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {photos.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setActiveIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`h-14 w-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                i === activeIndex ? "border-primary" : "border-transparent"
              }`}
            >
              <img src={photo.url} alt={photo.alt} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
