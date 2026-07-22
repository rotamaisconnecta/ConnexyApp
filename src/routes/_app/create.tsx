import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BottomNavPremium } from "@/components/navigation/bottom-nav";
import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CREATE_ACTIONS } from "@/lib/navigation/navigation-items";
import { getCreateActionByCategory } from "@/lib/navigation/navigation-utils";

export const Route = createFileRoute("/_app/create")({
  head: () => ({ meta: [{ title: "Criar publicação" }] }),
  component: CreatePage,
});

const gridContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const gridItem = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

function CreatePage() {
  const nav = useNavigate();
  const { category } = Route.useSearch();

  const activeCategory = category ? getCreateActionByCategory(category) : null;

  if (activeCategory) {
    return (
      <div className="flex-1 flex flex-col">
        <StatusBar />
        <div className="flex items-center gap-3 px-5 pt-1 pb-3">
          <Link to="/feed" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-base">Criar {activeCategory.label}</h1>
            <p className="text-[11px] text-muted-foreground">{activeCategory.description}</p>
          </div>
        </div>

        <div className="flex-1 px-5 pb-4 flex items-center justify-center">
          <div className="text-center space-y-3">
            <span className="text-6xl">{activeCategory.emoji}</span>
            <h2 className="font-display font-bold text-xl">Criar {activeCategory.label}</h2>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              {activeCategory.description}. Em breve disponível!
            </p>
            <button
              onClick={() => nav({ to: "/feed" })}
              className="mt-4 rounded-full bg-gradient-brand px-6 py-3 text-white text-sm font-semibold"
            >
              Voltar ao feed
            </button>
          </div>
        </div>

        <BottomNavPremium />
      </div>
    );
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
          variants={gridContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-3"
        >
          {CREATE_ACTIONS.map((action) => (
            <motion.button
              key={action.id}
              variants={gridItem}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              onClick={() =>
                nav({
                  to: "/_app/create",
                  search: { category: action.id.toLowerCase() },
                })
              }
              aria-label={`Criar ${action.label}`}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface shadow-soft hover:shadow-elevated transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <div className="h-16 w-16 rounded-full bg-white shadow-soft grid place-items-center text-3xl">
                {action.emoji}
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold leading-tight">{action.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  {action.description}
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      <BottomNavPremium />
    </div>
  );
}
