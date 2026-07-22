import { useState, useCallback } from "react";
import { useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { bottomNavContainer } from "./navigation-animations";
import { BottomNavItem } from "./bottom-nav-item";
import { FloatingPlusButton } from "./floating-plus-button";
import { CreateSheet } from "./create-sheet";
import { NAVIGATION_ITEMS } from "@/lib/navigation/navigation-items";
import { getActiveTab } from "@/lib/navigation/navigation-utils";
import { NavigationTab } from "@/lib/navigation/navigation-types";

interface BottomNavPremiumProps {
  unreadCount?: number;
  onNavigate?: (route: string) => void;
}

export function BottomNavPremium({ unreadCount = 0, onNavigate }: BottomNavPremiumProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const activeTab = getActiveTab(pathname);

  const handleCreateSelect = useCallback(
    (category: string) => {
      const route = `/create-post?category=${category.toLowerCase()}`;
      onNavigate?.(route);
    },
    [onNavigate],
  );

  return (
    <>
      <motion.nav
        variants={bottomNavContainer}
        initial="hidden"
        animate="visible"
        role="tablist"
        aria-label="Navegação principal"
        className="sticky bottom-0 left-0 right-0 z-30 h-20 bg-background/95 backdrop-blur-xl border-t shadow-xl rounded-t-3xl px-2 pt-2 pb-4 safe-area-pb"
      >
        <ul className="flex items-center justify-between h-full">
          {NAVIGATION_ITEMS.map((item) => {
            if (item.id === NavigationTab.CREATE) {
              return <FloatingPlusButton key={item.id} onTap={() => setIsSheetOpen(true)} />;
            }

            const badge = item.id === NavigationTab.CHAT ? unreadCount : undefined;

            return (
              <BottomNavItem
                key={item.id}
                item={{ ...item, badge }}
                isActive={activeTab === item.id}
              />
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
