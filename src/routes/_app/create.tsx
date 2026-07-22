import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BottomNavPremium } from "@/components/navigation/bottom-nav";
import { ChevronLeft, Image, Film, Type, Zap, MapPin, PartyPopper, Tag, Car } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { CreateCategoryValue } from "@/lib/navigation/navigation-types";
import { CREATE_ACTIONS } from "@/lib/navigation/navigation-items";
import { bottomNavContainer, bottomNavItem } from "@/components/navigation/navigation-animations";

export const Route = createFileRoute("/_app/create")({
  head: () => ({ meta: [{ title: "Criar publicação" }] }),
  component: CreatePage,
});

const CATEGORY_ICONS: Record<CreateCategoryValue, React.ComponentType<{ className?: string }>> = {
  PHOTO: Image,
  VIDEO: Film,
  REEL: Film,
  TEXT: Type,
  MOMENT: Zap,
  PLACE: MapPin,
  EVENT: PartyPopper,
  OFFER: Tag,
  ROUTE: Car,
};

function CreatePage() {
  const nav = useNavigate();

  function handleSelect(label: string) {
    const action = CREATE_ACTIONS.find((a) => a.label === label);
    if (action) {
      nav({ to: action.route });
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />

      <div className="flex items-center gap-3 px-5 pt-1 pb-3">
        <Link to="/feed" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-base">Criar publicação</h1>
          <p className="text-[11px] text-muted-foreground">O que você deseja compartilhar?</p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-4 overflow-y-auto no-scrollbar">
        <motion.div
          variants={bottomNavContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-3"
        >
          {CREATE_ACTIONS.map((action, i) => {
            const Icon = CATEGORY_ICONS[action.id];
            return (
              <motion.button
                key={action.id}
                custom={i}
                variants={bottomNavItem}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSelect(action.label)}
                aria-label={`Criar ${action.label}`}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <span className="text-4xl">{action.emoji}</span>
                <div className="text-center">
                  <div className="text-sm font-semibold">{action.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {action.description}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <BottomNavPremium />
    </div>
  );
}
