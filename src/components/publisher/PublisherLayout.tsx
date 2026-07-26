import type { ReactNode } from "react";
import { BrandScreen } from "@/components/ui/brand-screen";

interface PublisherLayoutProps {
  children: ReactNode;
  scroll?: boolean;
}

export function PublisherLayout({ children, scroll = true }: PublisherLayoutProps) {
  return (
    <BrandScreen padded={false} scroll={scroll} className="flex flex-col h-full min-h-0">
      {children}
    </BrandScreen>
  );
}
