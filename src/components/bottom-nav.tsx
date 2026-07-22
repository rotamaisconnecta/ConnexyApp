import { useState, useCallback } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Home, Map, MessageCircle, User } from "lucide-react";
import { FloatingConnexyButton } from "./navigation/floating-connexy-button";
import { CreateSheet } from "./navigation/create-sheet";
import { cn } from "@/lib/utils";
import { getUnreadBadgeCount } from "@/lib/navigation/navigation-utils";

const leftItems = [
  { to: "/feed", label: "Início", icon: Home },
  { to: "/", label: "Mapa", icon: Map },
];

const rightItems = [
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/profile", label: "Perfil", icon: User },
];

interface BottomNavProps {
  unreadCount?: number;
  notificationCount?: number;
  onNavigate?: (route: string) => void;
}

export function BottomNav({ unreadCount = 0, notificationCount = 0, onNavigate }: BottomNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleCreateSelect = useCallback(
    (category: string) => {
      const route = `/_app/create?category=${category.toLowerCase()}`;
      onNavigate?.(route);
      if (onNavigate) return;
      window.location.href = route;
    },
    [onNavigate],
  );

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        role="tablist"
        aria-label="Navegação principal"
        className="sticky bottom-0 left-0 right-0 z-30 h-20 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-xl rounded-t-3xl px-2 pt-2 pb-4"
      >
        <ul className="flex items-center justify-between h-full">
          {leftItems.map(({ to, label, icon: Icon }) => {
            const active =
              to === "/" ? pathname === to : pathname === to || pathname.startsWith(to + "/");
            const badge = to === "/feed" ? notificationCount : undefined;
            return (
              <li key={to} className="flex-1 flex justify-center">
                <Link
                  to={to as "/feed"}
                  aria-label={label}
                  tabIndex={0}
                  role="tab"
                  aria-selected={active}
                  className="flex flex-col items-center gap-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl relative"
                >
                  <span
                    className={cn(
                      "grid place-items-center h-9 w-9 rounded-full transition-all duration-200",
                      active
                        ? "bg-gradient-brand text-white shadow-elegant"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors duration-200",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -mt-7 ml-4 h-4 min-w-[16px] rounded-full bg-error text-white text-[9px] font-bold px-1 grid place-items-center">
                      {getUnreadBadgeCount(badge)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}

          <FloatingConnexyButton onTap={() => setIsSheetOpen(true)} />

          {rightItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            const badge = to === "/chat" ? unreadCount : undefined;
            return (
              <li key={to} className="flex-1 flex justify-center">
                <Link
                  to={to as "/chat"}
                  aria-label={label}
                  tabIndex={0}
                  role="tab"
                  aria-selected={active}
                  className="flex flex-col items-center gap-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl relative"
                >
                  <span
                    className={cn(
                      "grid place-items-center h-9 w-9 rounded-full transition-all duration-200",
                      active
                        ? "bg-gradient-brand text-white shadow-elegant"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors duration-200",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -mt-7 ml-4 h-4 min-w-[16px] rounded-full bg-error text-white text-[9px] font-bold px-1 grid place-items-center">
                      {getUnreadBadgeCount(badge)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </motion.nav>

      <CreateSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSelect={handleCreateSelect}
      />
    </>
  );
}
