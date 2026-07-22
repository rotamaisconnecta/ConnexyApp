import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { bottomNavItem } from "./navigation-animations";
import { getUnreadBadgeCount } from "@/lib/navigation/navigation-utils";
import type { NavigationItem } from "@/lib/navigation/navigation-types";
import { House, Map, MessageCircle, User } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  House,
  Map,
  MessageCircle,
  User,
};

interface BottomNavItemProps {
  item: NavigationItem;
  isActive: boolean;
}

export function BottomNavItem({ item, isActive }: BottomNavItemProps) {
  const Icon = ICON_MAP[item.icon];

  if (!Icon) return null;

  return (
    <motion.li variants={bottomNavItem} className="flex-1 flex justify-center">
      <Link
        to={item.route as "/feed" | "/chat" | "/profile" | "/"}
        aria-label={item.label}
        tabIndex={0}
        role="tab"
        aria-selected={isActive}
        className="flex flex-col items-center gap-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
      >
        <span
          className={cn(
            "grid place-items-center h-9 w-9 rounded-full transition-all duration-200",
            isActive
              ? "bg-gradient-brand text-white shadow-elegant"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>

        <span
          className={cn(
            "text-[10px] font-medium transition-colors duration-200",
            isActive ? "text-primary" : "text-muted-foreground",
          )}
        >
          {item.label}
        </span>

        {item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -mt-6 ml-3 h-4 min-w-[16px] rounded-full bg-error text-white text-[9px] font-bold px-1 grid place-items-center">
            {getUnreadBadgeCount(item.badge)}
          </span>
        )}
      </Link>
    </motion.li>
  );
}
