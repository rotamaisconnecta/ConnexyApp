import { cn } from "@/lib/utils";

interface BrandAvatarProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

const sizeClassMap: Record<NonNullable<BrandAvatarProps["size"]>, string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
};

const badgeSizeMap: Record<NonNullable<BrandAvatarProps["size"]>, string> = {
  sm: "w-2.5 h-2.5 border",
  md: "w-3 h-3 border-2",
  lg: "w-3.5 h-3.5 border-2",
  xl: "w-4 h-4 border-2",
};

export function BrandAvatar({ src, alt = "", size = "md", online, className }: BrandAvatarProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "rounded-full bg-[#F4F1FF] overflow-hidden flex items-center justify-center",
          sizeClassMap[size],
        )}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[#6C3BFF] font-semibold text-sm">
            {alt.charAt(0).toUpperCase() || "?"}
          </span>
        )}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-white",
            badgeSizeMap[size],
            online ? "bg-[#22C55E]" : "bg-[#71717A]",
          )}
        />
      )}
    </div>
  );
}
