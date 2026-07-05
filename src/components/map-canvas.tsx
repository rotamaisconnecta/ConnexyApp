import { motion } from "framer-motion";

type Pin = { x: number; y: number; kind?: "user" | "driver" | "person" | "place" | "event" | "promo"; label?: string };

const colorFor = (kind?: Pin["kind"]) => {
  switch (kind) {
    case "user": return "var(--primary)";
    case "driver": return "#111";
    case "person": return "oklch(0.72 0.2 355)";
    case "place": return "oklch(0.6 0.22 300)";
    case "event": return "oklch(0.72 0.19 40)";
    case "promo": return "oklch(0.55 0.24 295)";
    default: return "var(--primary)";
  }
};

export function MapCanvas({
  height = 260,
  pins = [],
  route,
  className = "",
}: {
  height?: number;
  pins?: Pin[];
  route?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}
         style={{ height, background: "linear-gradient(180deg, #efeaff 0%, #f7f3ff 100%)" }}>
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
        {/* Blocks */}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={`h${i}`} x={0} y={30 + i * 40} width={400} height={22} fill="#e8e0ff" opacity={0.5} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={`v${i}`} x={20 + i * 40} y={0} width={22} height={300} fill="#e8e0ff" opacity={0.5} />
        ))}
        {/* Streets */}
        <line x1="0" y1="120" x2="400" y2="120" stroke="#fff" strokeWidth="10" />
        <line x1="0" y1="220" x2="400" y2="220" stroke="#fff" strokeWidth="8" />
        <line x1="200" y1="0" x2="200" y2="300" stroke="#fff" strokeWidth="10" />
        <line x1="80" y1="0" x2="80" y2="300" stroke="#fff" strokeWidth="6" />
        <line x1="320" y1="0" x2="320" y2="300" stroke="#fff" strokeWidth="6" />
        {/* Park */}
        <circle cx="320" cy="80" r="34" fill="#c7f1d9" />
        <circle cx="60" cy="240" r="26" fill="#c7f1d9" />
        {/* Route */}
        {route && (
          <motion.path
            d="M 60 260 Q 140 260 200 200 T 340 60"
            stroke="var(--primary)" strokeWidth="5" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: "easeInOut" }}
          />
        )}
      </svg>

      {pins.map((p, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, y: -8 }} animate={{ scale: 1, y: 0 }} transition={{ delay: i * 0.06, type: "spring", stiffness: 260 }}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <div className="flex flex-col items-center">
            {p.label && (
              <span className="mb-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold shadow-soft whitespace-nowrap">
                {p.label}
              </span>
            )}
            <span
              className="grid place-items-center h-7 w-7 rounded-full text-white text-[10px] font-bold shadow-elegant ring-2 ring-white"
              style={{ background: colorFor(p.kind) }}
            >
              {p.kind === "user" ? "•" : p.kind === "driver" ? "🚗" : p.kind === "event" ? "★" : p.kind === "promo" ? "%" : "•"}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
