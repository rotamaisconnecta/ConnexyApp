import { useState, useCallback } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Home, Map, MessageCircle, User, LayoutDashboard, Car, Store } from "lucide-react";
import { FloatingConnexyButton } from "./navigation/floating-connexy-button";
import { CreateSheet } from "./navigation/create-sheet";
import { cn } from "@/lib/utils";
import { getUnreadBadgeCount } from "@/lib/navigation/navigation-utils";
import { UserRole, type RoleMode } from "@/lib/roles/roles-types";
import { getStoredRoles } from "@/lib/roles/roles-storage";
import {
  canUserCreateCategory,
  getPermissionsForRoles,
} from "@/lib/roles/roles-utils";
import RoleActivationModal from "@/components/roles/RoleActivationModal";

const passengerLeftItems = [
  { to: "/feed", label: "Início", icon: Home },
  { to: "/discover", label: "Mapa", icon: Map },
];

const passengerRightItems = [
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/profile", label: "Perfil", icon: User },
];

const driverLeftItems = [
  { to: "/driver", label: "Painel", icon: LayoutDashboard },
  { to: "/discover", label: "Mapa", icon: Map },
];

const driverRightItems = [
  { to: "/driver", label: "Corridas", icon: Car },
  { to: "/profile", label: "Perfil", icon: User },
];

const businessLeftItems = [
  { to: "/feed", label: "Início", icon: Home },
  { to: "/marketplace", label: "Market", icon: Store },
];

const businessRightItems = [
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/profile", label: "Perfil", icon: User },
];

interface BottomNavProps {
  mode?: RoleMode;
  unreadCount?: number;
  notificationCount?: number;
}

export function BottomNav({
  mode = UserRole.USER,
  unreadCount = 0,
  notificationCount = 0,
}: BottomNavProps) {
  const isDriver = mode === UserRole.DRIVER;
  const isBusiness = mode === UserRole.BUSINESS;
  const leftItems = isDriver
    ? driverLeftItems
    : isBusiness
      ? businessLeftItems
      : passengerLeftItems;
  const rightItems = isDriver
    ? driverRightItems
    : isBusiness
      ? businessRightItems
      : passengerRightItems;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [blockedModal, setBlockedModal] = useState<{
    open: boolean;
    role: UserRole | null;
  }>({ open: false, role: null });

  function categoryToRole(category: string): UserRole | null {
    switch (category.toLowerCase()) {
      case "ride": return UserRole.DRIVER;
      case "offer": return UserRole.BUSINESS;
      case "event": return UserRole.EVENT_CREATOR;
      case "place": return UserRole.PLACE_OWNER;
      default: return null;
    }
  }

  const handleCreateSelect = useCallback(
    (category: string) => {
      const { roles } = getStoredRoles();
      const permissions = getPermissionsForRoles(roles);

      if (canUserCreateCategory(category, permissions)) {
        navigate({ to: `/create/${category.toLowerCase()}` });
      } else {
        const role = categoryToRole(category);
        if (role) setBlockedModal({ open: true, role });
      }
      setIsSheetOpen(false);
    },
    [navigate],
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

      <RoleActivationModal
        open={blockedModal.open}
        role={blockedModal.role!}
        onClose={() => setBlockedModal({ open: false, role: null })}
      />
    </>
  );
}
