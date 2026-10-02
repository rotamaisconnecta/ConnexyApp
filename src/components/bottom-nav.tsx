import { Home, Map, MessagesSquare, Plus, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
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
  { id: "conversations", label: "Conversas", icon: MessagesSquare, route: "/chat" },
  { id: "settings", label: "Configurações", icon: Settings, route: "/profile" },
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
          "relative flex h-full min-w-0 w-full flex-col items-center justify-end gap-0.5 rounded-2xl px-0.5 pb-2 pt-1 outline-none transition-colors",
          active ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="relative grid place-items-center">
          <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
        </span>
        <span
          className={cn(
            "w-full truncate text-center text-[11px] leading-tight",
            active ? "font-semibold" : "font-medium",
          )}
        >
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <nav
      role="navigation"
      aria-label="Navegação principal"
      className="absolute inset-x-0 bottom-0 z-50 border-t border-zinc-100 bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_28px_rgba(17,17,17,0.06)]"
    >
      <div className="grid h-[var(--bottom-nav-height,4.75rem)] grid-cols-5 items-stretch px-1 min-[360px]:px-2">
        {leftItems.map(renderItem)}

        <div className="relative z-10 grid min-w-0 place-items-center self-center">
          <button
            type="button"
            onClick={() => navigate({ to: "/create" })}
            aria-label="Criar publicação"
            className={cn(
              "relative -mt-6 grid size-[3.35rem] place-items-center rounded-full bg-gradient-brand text-white shadow-[0_10px_24px_rgba(124,58,237,0.38)] ring-[3px] ring-white transition-transform active:scale-95",
              isActive(pathname, "/create") && "ring-primary/25",
            )}
          >
            <Plus size={22} strokeWidth={2.3} />
          </button>
        </div>

        {rightItems.map(renderItem)}
      </div>
    </nav>
  );
}
