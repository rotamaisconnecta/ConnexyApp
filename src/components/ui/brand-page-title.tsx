import { cn } from "@/lib/utils";

interface BrandPageTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function BrandPageTitle({ title, subtitle, className }: BrandPageTitleProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <h1 className="text-2xl font-bold text-[#18181B]">{title}</h1>
      {subtitle && <p className="text-sm text-[#71717A]">{subtitle}</p>}
    </div>
  );
}
