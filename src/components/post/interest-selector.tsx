import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { chipContainer, chipItem } from "@/components/profile/animations";

interface InterestSelectorProps {
  interests: string[];
  selected: string[];
  onToggle: (interest: string) => void;
}

export function InterestSelector({ interests, selected, onToggle }: InterestSelectorProps) {
  return (
    <motion.div
      variants={chipContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap gap-2"
    >
      {interests.map((interest) => {
        const active = selected.includes(interest);
        return (
          <motion.button
            key={interest}
            type="button"
            variants={chipItem}
            onClick={() => onToggle(interest)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground hover:border-primary/40",
            )}
            aria-pressed={active}
          >
            {interest}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
