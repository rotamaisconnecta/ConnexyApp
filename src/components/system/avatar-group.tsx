import { cn } from "@/lib/utils";
import { Colors, Radius } from "@/lib/branding/brand-config";
import { BrandAvatar } from "@/components/ui/brand-avatar";

interface AvatarItem {
  src?: string;
  alt?: string;
}

interface AvatarGroupProps {
  avatars: AvatarItem[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClassMap: Record<NonNullable<AvatarGroupProps["size"]>, string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
};

const badgeSizeMap: Record<NonNullable<AvatarGroupProps["size"]>, string> = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-14 h-14 text-sm",
};

export function AvatarGroup({ avatars, max = 4, size = "md", className }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((avatar, i) => (
        <div
          key={`${avatar.alt}-${i}`}
          className="relative"
          style={{ marginLeft: i === 0 ? 0 : -8, zIndex: visible.length - i }}
        >
          <BrandAvatar src={avatar.src} alt={avatar.alt} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full font-medium",
            badgeSizeMap[size],
          )}
          style={{
            marginLeft: -8,
            zIndex: 0,
            backgroundColor: Colors.surface,
            color: Colors.text.secondary,
            borderRadius: Radius.floating,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
