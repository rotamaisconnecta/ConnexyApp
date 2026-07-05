import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Route as RouteIcon, MessageCircle, Store, User } from "lucide-react";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/rota", label: "Rota", icon: RouteIcon },
  { to: "/connecta", label: "Connecta", icon: MessageCircle },
  { to: "/locais", label: "Locais", icon: Store },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="sticky bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur px-2 pt-2 pb-4">
      <ul className="flex items-center justify-between">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={to} className="flex-1">
              <Link to={to} className="flex flex-col items-center gap-1 py-1">
                <span className={`grid place-items-center h-9 w-9 rounded-full transition-all ${active ? "bg-gradient-brand text-white shadow-elegant" : "text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
