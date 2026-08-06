import { Home, Map, MessagesSquare, User, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  route: "/home" | "/discover" | "/chat" | "/profile";
}

const NAV_ITEMS: BottomNavItem[] = [
  { id: "home", label: "Home", icon: Home, route: "/home" },
  { id: "map", label: "Mapa", icon: Map, route: "/discover" },
  { id: "conversas", label: "Conversas", icon: MessagesSquare, route: "/chat" },
  { id: "profile", label: "Perfil", icon: User, route: "/profile" },
];

function isActive(pathname: string, route: string): boolean {
  if (pathname === route) return true;
  return pathname.startsWith(route + "/");
}

export default function BottomNav() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
          "relative flex flex-col items-center justify-center gap-1 transition-colors outline-none",
          active ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="relative grid place-items-center">
          <Icon size={22} strokeWidth={active ? 2.4 : 2} />
          {active && (
            <motion.span
              layoutId={`bottom-nav-dot-${item.id}`}
              className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-primary"
            />
          )}
        </span>
        <span className="text-[10px] font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <nav
      role="tablist"
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
    >
      <div className="grid h-20 grid-cols-5 items-center px-2">
        {leftItems.map((item) => renderItem(item))}

        <div className="grid place-items-center">
          <button
            type="button"
            onClick={() => navigate({ to: "/create" })}
            aria-label="Criar publicação"
            className={cn(
              "relative -mt-6 grid h-14 w-14 place-items-center rounded-full bg-gradient-brand text-white shadow-floating transition-transform active:scale-95",
              isActive(pathname, "/create") && "ring-4 ring-primary/20",
            )}
          >
            <Plus size={26} strokeWidth={2.4} />
          </button>
        </div>

        {rightItems.map((item) => renderItem(item))}
      </div>
    </nav>
  );
}
