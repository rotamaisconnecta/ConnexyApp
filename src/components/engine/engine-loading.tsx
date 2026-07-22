import { motion } from "framer-motion";

export function EngineLoading() {
  const sections = Array.from({ length: 3 });
  const cards = Array.from({ length: 4 });

  return (
    <div className="flex flex-col gap-6 p-4">
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="space-y-3"
      >
        <div className="h-8 w-48 rounded-full bg-[#E7E7F2]" />
        <div className="h-4 w-32 rounded-full bg-[#E7E7F2]" />
      </motion.div>

      {sections.map((_, s) => (
        <div key={s} className="space-y-3">
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: s * 0.15 }}
            className="flex items-center gap-2 px-1"
          >
            <div className="h-5 w-5 rounded bg-[#E7E7F2]" />
            <div className="h-4 w-40 rounded-full bg-[#E7E7F2]" />
          </motion.div>

          <div className="flex gap-3 overflow-hidden">
            {cards.map((_, c) => (
              <motion.div
                key={c}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: (s * 4 + c) * 0.08 }}
                className="h-44 w-36 shrink-0 rounded-2xl bg-[#E7E7F2]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
