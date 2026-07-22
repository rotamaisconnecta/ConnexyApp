import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BrandInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function BrandInput({ label, error, className, ...rest }: BrandInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[#18181B]">{label}</label>}
      <input
        className={cn(
          "h-12 rounded-[18px] border border-[#E7E7F2] bg-white px-4 text-base text-[#18181B] placeholder:text-[#71717A] outline-none transition-colors focus:border-[#6C3BFF] focus:ring-2 focus:ring-[#6C3BFF]/20",
          error && "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20",
          className,
        )}
        {...rest}
      />
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}
