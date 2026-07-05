export function Logo({ size = 40, variant = "dark" }: { size?: number; variant?: "dark" | "light" }) {
  const fg = variant === "dark" ? "#0f0a1f" : "#ffffff";
  return (
    <div className="flex items-center gap-2">
      <div
        className="grid place-items-center rounded-xl bg-gradient-brand text-white font-black shadow-elegant"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        R+
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg font-bold" style={{ color: fg }}>RotaMais</div>
        <div className="text-[11px] font-semibold -mt-0.5" style={{ color: "var(--primary)" }}>Connecta</div>
      </div>
    </div>
  );
}
