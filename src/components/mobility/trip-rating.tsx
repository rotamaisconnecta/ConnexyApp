import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DriverMatch, TripRating } from "@/lib/mobility/ride-types";

interface TripRatingProps {
  driver: DriverMatch;
  onSubmit: (rating: TripRating) => void;
}

const QUICK_TAGS = [
  "Motorista simpático",
  "Carro limpo",
  "Rota rápida",
  "Boa conversa",
  "Dirige bem",
  "Música boa",
];

export function TripRatingPanel({ driver, onSubmit }: TripRatingProps) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function handleSubmit() {
    onSubmit({
      score,
      comment,
      tags: selectedTags,
      createdAt: new Date(),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col flex-1 px-6 pt-6"
    >
      <div className="flex flex-col items-center text-center">
        <img src={driver.photo} alt="" className="h-20 w-20 rounded-full object-cover" />
        <div className="mt-3 font-semibold">{driver.name}</div>
        <div className="text-[11px] text-muted-foreground">
          {driver.vehicle.name} · {driver.vehicle.plate}
        </div>
      </div>

      <h1 className="mt-8 font-display text-xl font-bold text-center">Como foi sua viagem?</h1>

      <div className="mt-4 flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button key={n} whileTap={{ scale: 0.9 }} onClick={() => setScore(n)}>
            <Star
              className={cn(
                "h-9 w-9 transition-colors",
                n <= score ? "fill-primary text-primary" : "text-border",
              )}
            />
          </motion.button>
        ))}
      </div>

      <label className="mt-6 block">
        <span className="text-xs font-medium text-muted-foreground">
          Deixe um comentário (opcional)
        </span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              selectedTags.includes(tag)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            + {tag}
          </button>
        ))}
      </div>

      <div className="mt-auto pb-4">
        <button
          onClick={handleSubmit}
          className="w-full rounded-full bg-gradient-brand py-4 text-white font-semibold shadow-elegant"
        >
          Finalizar
        </button>
      </div>
    </motion.div>
  );
}
