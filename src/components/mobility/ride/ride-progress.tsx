import { motion } from "framer-motion";
import { RIDE_LILAC, RIDE_PURPLE } from "./ride-sheet";

export const RIDE_STEPS = [
  { label: "Solicitada" },
  { label: "Motorista a caminho" },
  { label: "Embarque" },
  { label: "Viagem" },
  { label: "Chegada" },
] as const;

/** progress: 0..4 (índice do passo atual) */
export function RideProgress({ progress }: { progress: number }) {
  return (
    <div className="flex items-start justify-between" role="list" aria-label="Progresso da viagem">
      {RIDE_STEPS.map((step, index) => {
        const done = index < progress;
        const current = index === progress;
        return (
          <div key={step.label} className="flex flex-1 flex-col items-center" role="listitem">
            <motion.span
              layout
              className={`grid h-[22px] w-[22px] grid-cols-1 place-items-center rounded-full text-[9px] font-bold transition-colors ${
                done
                  ? "text-white"
                  : current
                    ? "bg-transparent ring-2"
                    : "bg-[#F2F2F4] text-[#8E8E93]"
              }`}
              style={
                done
                  ? { background: RIDE_LILAC }
                  : current
                    ? {
                        boxShadow: `0 0 0 4px rgba(168,85,247,0.20)`,
                        color: RIDE_PURPLE,
                        ...({ "--tw-ring-color": RIDE_PURPLE } as object),
                      }
                    : undefined
              }
              animate={{ scale: current ? 1.12 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {done ? "✓" : current ? "●" : index + 1}
            </motion.span>
            <span
              className={`mt-1.5 text-center text-[8.5px] leading-tight ${
                current || done ? "font-bold text-[#111111]" : "font-medium text-zinc-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
