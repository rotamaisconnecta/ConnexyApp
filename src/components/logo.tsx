import connexaLogo from "@/assets/connexa-logo.png.asset.json";

export function Logo({
  size = 40,
  showWordmark = true,
}: {
  size?: number;
  variant?: "dark" | "light";
  showWordmark?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <img
        src={connexaLogo.url}
        alt="Connexa"
        style={{ width: size, height: size }}
        className="object-contain"
      />
      {showWordmark ? (
        <div className="leading-tight">
          <div className="font-display text-lg font-bold" style={{ color: "var(--foreground)" }}>
            connexa
          </div>
          <div className="text-[10px] font-semibold -mt-0.5 text-muted-foreground">
            Mova-se · Conecte-se · Descubra
          </div>
        </div>
      ) : null}
    </div>
  );
}
