import { AnimatePresence, motion } from "framer-motion";
import { RIDE_LILAC } from "./ride-sheet";

/* Connexy Ride Capsule — assinatura visual da mobilidade.
   Cápsula flutuante no topo, fundo quase preto, texto branco,
   indicador lilás discreto. Transições subtis de texto. */

export function RideCapsule({
  text,
  pulse = false,
  className = "",
}: {
  text: string;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-4 z-30 flex justify-center ${className}`}
    >
      <div className="flex h-[34px] max-w-[80%] items-center gap-2 rounded-full bg-[#111111]/95 px-4 shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
        {pulse ? (
          <span className="relative flex h-2 w-2" aria-hidden>
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
              style={{ background: RIDE_LILAC }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ background: RIDE_LILAC }}
            />
          </span>
        ) : (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: RIDE_LILAC }}
            aria-hidden
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={text}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="truncate text-[12px] font-semibold leading-none text-white"
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function RoundIconButton({
  label,
  icon: Icon,
  onClick,
  small = false,
  className = "",
}: {
  label: string;
  icon: typeof import("lucide-react").Car;
  onClick?: () => void;
  small?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid grid-cols-1 place-items-center rounded-full bg-zinc-100 text-zinc-800 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800 ${
        small ? "h-9 w-9" : "h-11 w-11"
      } ${className}`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
    </button>
  );
}
