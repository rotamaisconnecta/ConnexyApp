import { motion } from "framer-motion";

interface TypingIndicatorProps {
  name: string;
  photo: string;
}

const dot = {
  initial: { y: 0 },
  animate: (i: number) => ({
    y: [0, -4, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      delay: i * 0.15,
      ease: "easeInOut" as const,
    },
  }),
};

export function TypingIndicator({ name, photo }: TypingIndicatorProps) {
  return (
    <div className="flex items-end gap-2 mt-2 px-3">
      <img src={photo} alt="" className="h-6 w-6 rounded-lg object-cover mt-auto shrink-0" />
      <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-3 py-2.5 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            custom={i}
            variants={dot}
            initial="initial"
            animate="animate"
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground mb-0.5">{name} digitando</span>
    </div>
  );
}
