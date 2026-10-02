import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Pin = {
  x: number;
  y: number;
  kind?: "user" | "driver" | "person" | "place" | "event" | "promo";
  label?: string;
  labelPlacement?: "top" | "bottom";
};

const colorFor = (kind?: Pin["kind"]) => {
  switch (kind) {
    case "user":
      return "var(--primary)";
    case "driver":
      return "#111";
    case "person":
      return "oklch(0.72 0.2 355)";
    case "place":
      return "oklch(0.6 0.22 300)";
    case "event":
      return "oklch(0.72 0.19 40)";
    case "promo":
      return "oklch(0.55 0.24 295)";
    default:
      return "var(--primary)";
  }
};

export function MapCanvas({
  height = 260,
  pins = [],
  route,
  routePath,
  routeColor,
  stretch = false,
  className = "",
  children,
}: {
  height?: number;
  pins?: Pin[];
  route?: boolean;
  routePath?: string;
  routeColor?: string;
  stretch?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden ${stretch ? "h-full w-full" : "rounded-2xl"} ${className}`}
      style={{ ...(stretch ? {} : { height }), background: "#F3F0EA" }}
    >
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
        <rect width="400" height="300" fill="#F3F0EA" />
        <rect x="0" y="168" width="400" height="78" fill="#D7ECF6" opacity="0.85" />
        <path d="M 0 175 Q 90 188 170 172 T 400 186 L 400 246 Q 210 232 0 246 Z" fill="#C9E6F4" />
        {Array.from({ length: 9 }).map((_, i) => (
          <rect
            key={`h${i}`}
            x={0}
            y={18 + i * 32}
            width={400}
            height={14}
            fill="#E7E1D6"
            opacity={0.55}
          />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <rect
            key={`v${i}`}
            x={8 + i * 36}
            y={0}
            width={14}
            height={300}
            fill="#E7E1D6"
            opacity={0.45}
          />
        ))}
        <line x1="0" y1="118" x2="400" y2="118" stroke="#F7F5F1" strokeWidth="9" />
        <line x1="0" y1="214" x2="400" y2="214" stroke="#F7F5F1" strokeWidth="7" />
        <line x1="196" y1="0" x2="196" y2="300" stroke="#F7F5F1" strokeWidth="9" />
        <line x1="72" y1="0" x2="72" y2="300" stroke="#F7F5F1" strokeWidth="5" />
        <line x1="312" y1="0" x2="312" y2="300" stroke="#F7F5F1" strokeWidth="5" />
        <ellipse cx="318" cy="86" rx="42" ry="30" fill="#CDE9D4" />
        <ellipse cx="58" cy="228" rx="30" ry="22" fill="#CDE9D4" />
        <ellipse cx="248" cy="198" rx="26" ry="18" fill="#D4EBC0" />
        {route && (
          <motion.path
            key={routePath ?? "default-route"}
            d={routePath ?? "M 60 260 Q 140 260 200 200 T 340 60"}
            stroke={routeColor ?? "var(--primary)"}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />
        )}
      </svg>

      {pins.map((p, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, y: -8 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: i * 0.06, type: "spring", stiffness: 260 }}
          className="absolute -translate-x-1/2"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <div
            className={`flex flex-col items-center ${p.labelPlacement === "bottom" ? "" : "-translate-y-full"}`}
          >
            {p.labelPlacement === "bottom" ? (
              <>
                <span
                  className="grid place-items-center h-7 w-7 rounded-full text-white text-[10px] font-bold shadow-elegant ring-2 ring-white"
                  style={{ background: colorFor(p.kind) }}
                >
                  {p.kind === "user"
                    ? "•"
                    : p.kind === "driver"
                      ? "🚗"
                      : p.kind === "event"
                        ? "★"
                        : p.kind === "promo"
                          ? "%"
                          : "•"}
                </span>
                {p.label && (
                  <span className="mt-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold shadow-soft whitespace-nowrap">
                    {p.label}
                  </span>
                )}
              </>
            ) : (
              <>
                {p.label && (
                  <span className="mb-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold shadow-soft whitespace-nowrap">
                    {p.label}
                  </span>
                )}
                <span
                  className="grid place-items-center h-7 w-7 rounded-full text-white text-[10px] font-bold shadow-elegant ring-2 ring-white"
                  style={{ background: colorFor(p.kind) }}
                >
                  {p.kind === "user"
                    ? "•"
                    : p.kind === "driver"
                      ? "🚗"
                      : p.kind === "event"
                        ? "★"
                        : p.kind === "promo"
                          ? "%"
                          : "•"}
                </span>
              </>
            )}
          </div>
        </motion.div>
      ))}
      {children}
    </div>
  );
}
