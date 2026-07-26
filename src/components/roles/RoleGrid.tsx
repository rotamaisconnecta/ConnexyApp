import type { ReactNode } from "react";

interface RoleGridProps {
  children: ReactNode;
}

export function RoleGrid({ children }: RoleGridProps) {
  return <div className="grid grid-cols-1 gap-3">{children}</div>;
}
