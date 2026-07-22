import { cn } from "@/lib/utils";
import { Colors, Radius } from "@/lib/branding/brand-config";

type SkeletonVariant =
  "TEXT" | "CARD" | "AVATAR" | "IMAGE" | "LIST" | "FEED" | "CHAT" | "MARKETPLACE";

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  count?: number;
}

const shimmerClass =
  "bg-gradient-to-r from-[#F4F1FF] via-[#E7E7F2] to-[#F4F1FF] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]";

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn(shimmerClass, "rounded", className)} style={style} />;
}

function TextSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-5/6" />
      <SkeletonBlock className="h-4 w-4/6" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden" style={{ borderRadius: Radius.md }}>
      <SkeletonBlock className="h-40 w-full" />
      <div className="space-y-3 p-4">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-4 w-1/2" />
        <SkeletonBlock className="h-4 w-2/3" />
      </div>
    </div>
  );
}

function AvatarSkeleton() {
  return <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />;
}

function ImageSkeleton() {
  return <SkeletonBlock className="h-48 w-full" style={{ borderRadius: Radius.md }} />;
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
            <SkeletonBlock className="h-4 w-1/3" />
          </div>
          <SkeletonBlock className="h-48 w-full" style={{ borderRadius: Radius.md }} />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
          <SkeletonBlock
            className="h-10"
            style={{
              width: `${60 + Math.random() * 30}%`,
              borderRadius: Radius.sm,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function MarketplaceSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="overflow-hidden" style={{ borderRadius: Radius.md }}>
          <SkeletonBlock className="h-32 w-full" />
          <div className="space-y-2 p-3">
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-3 w-1/2" />
            <SkeletonBlock className="h-5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

const variantMap: Record<SkeletonVariant, React.FC<{ style?: React.CSSProperties }>> = {
  TEXT: TextSkeleton,
  CARD: CardSkeleton,
  AVATAR: AvatarSkeleton,
  IMAGE: ImageSkeleton,
  LIST: ListSkeleton,
  FEED: FeedSkeleton,
  CHAT: ChatSkeleton,
  MARKETPLACE: MarketplaceSkeleton,
};

export function Skeleton({ variant = "TEXT", className, count = 1 }: SkeletonProps) {
  const VariantComponent = variantMap[variant];

  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <VariantComponent key={i} />
      ))}
    </div>
  );
}
