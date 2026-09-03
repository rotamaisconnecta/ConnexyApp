import { Home, Map, Plus, User, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  route: "/home" | "/discover" | "/pessoas" | "/perfil";
}

const NAV_ITEMS: BottomNavItem[] = [
  { id: "home", label: "Home", icon: Home, route: "/home" },
  { id: "map", label: "Mapa", icon: Map, route: "/discover" },
  { id: "people", label: "Pessoas", icon: UsersRound, route: "/pessoas" },
  { id: "profile", label: "Perfil", icon: User, route: "/perfil" },
];

function isActive(pathname: string, route: string): boolean {
  if (pathname === route) return true;
  return pathname.startsWith(route + "/");
}

export default function BottomNav() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const leftItems = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(2);

  const renderItem = (item: BottomNavItem) => {
    const active = isActive(pathname, item.route);
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => navigate({ to: item.route })}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl py-2 outline-none transition-colors",
          active ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="relative grid place-items-center">
          <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
          {active && (
            <motion.span
              layoutId="bottom-nav-indicator"
              className="absolute -bottom-2 h-1 w-1 rounded-full bg-primary"
            />
          )}
        </span>
        <span className="truncate text-[10px] font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <nav
      role="navigation"
      aria-label="Navegação principal"
      className="absolute inset-x-0 bottom-0 z-50 border-t border-border/40 bg-background/80 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-10px_35px_rgba(0,0,0,0.05)] backdrop-blur-2xl"
    >
      <div className="grid h-[4.75rem] grid-cols-5 items-center px-2">
        {leftItems.map(renderItem)}

        <div className="grid place-items-center">
          <button
            type="button"
            onClick={() => navigate({ to: "/create" })}
            aria-label="Criar publicação"
            className={cn(
              "relative -mt-5 grid h-14 w-14 place-items-center rounded-full bg-gradient-brand text-white shadow-floating transition-transform active:scale-95",
              isActive(pathname, "/create") && "ring-4 ring-primary/20",
            )}
          >
            <Plus size={25} strokeWidth={2.3} />
          </button>
        </div>

        {rightItems.map(renderItem)}
      </div>
    </nav>
  );
}