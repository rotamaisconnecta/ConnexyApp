import { cn } from "@/lib/utils";
import { Colors } from "@/lib/branding/brand-config";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message, fullScreen = true }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen && "fixed inset-0 z-50",
      )}
      style={{ background: fullScreen ? Colors.background : "transparent" }}
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-4"
        style={{
          borderColor: "#E7E7F2",
          borderTopColor: Colors.brand.primary,
        }}
      />
      {message && (
        <p className="text-sm font-medium" style={{ color: Colors.text.secondary }}>
          {message}
        </p>
      )}
    </div>
  );
}
