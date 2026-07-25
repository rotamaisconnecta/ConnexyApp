import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Colors, Radius } from "@/theme";

interface BrandInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function BrandInput({ label, error, className, ...rest }: BrandInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium" style={{ color: Colors.text.primary }}>
          {label}
        </label>
      )}
      <input
        className={cn(
          "h-12 bg-white px-4 text-base outline-none transition-colors",
          error && "focus:ring-2",
          className,
        )}
        style={{
          borderRadius: Radius.md,
          border: `1px solid ${error ? Colors.danger : Colors.border}`,
          color: Colors.text.primary,
          ["--tw-placeholder-color" as string]: Colors.text.secondary,
        }}
        {...rest}
      />
      {error && (
        <p className="text-xs" style={{ color: Colors.danger }}>
          {error}
        </p>
      )}
    </div>
  );
}
