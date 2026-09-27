import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { StatusBar } from "@/components/phone-frame";
import { Colors } from "@/theme";
import { currentUser } from "@/lib/mock-data";
import { LOCAL_CATALOG_DISCLAIMER } from "@/lib/catalog/local-catalog";

export const Route = createFileRoute("/_app/my-connexy")({
  head: () => ({ meta: [{ title: "Meu Connexy — Central" }] }),
  component: MyConnexyPage,
});

const QUICK_ACTIONS = [
  {
    label: "Criar Negócio",
    emoji: "🏢",
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
    to: "/create/place-business",
  },
  {
    label: "Criar Evento",
    emoji: "📅",
    gradient: "linear-gradient(135deg, #EC4899, #DB2777)",
    to: "/create/event",
  },
  {
    label: "Criar Local",
    emoji: "📍",
    gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
    to: "/create/place",
  },
  {
    label: "Nova Oferta",
    emoji: "🏷️",
    gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
    to: "/create/offer",
  },
] as const;

const animatedItem = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: "easeOut" as const },
  }),
};

function MyConnexyPage() {
  return (
    <div className="flex-1 min-h-0">
      <StatusBar />

      <div className="h-full overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+7rem)]">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-3 pb-5"
        >
          <div className="flex items-center gap-4">
            <img
              src={currentUser.photo}
              alt={currentUser.name}
              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white shadow-soft"
            />
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold" style={{ color: Colors.text.primary }}>
                Meu Connexy
              </h1>
              <p className="text-xs text-muted-foreground">Seu centro de gerenciamento.</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                <span className="min-w-0 text-xs text-muted-foreground truncate">
                  {currentUser.name}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Ações rápidas
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            {LOCAL_CATALOG_DISCLAIMER}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action, i) => (
              <motion.div
                key={action.label}
                custom={i}
                variants={animatedItem}
                initial="hidden"
                animate="visible"
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to={action.to}
                  aria-label={action.label}
                  className="flex items-center gap-3 p-4 rounded-2xl text-white shadow-floating"
                  style={{ background: action.gradient }}
                >
                  <span className="text-2xl shrink-0">{action.emoji}</span>
                  <span className="min-w-0 flex-1 text-sm font-bold leading-tight">
                    {action.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Estatísticas
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Estatísticas de cadastro ainda não estão disponíveis no MVP local.
          </p>
        </section>
      </div>
    </div>
  );
}
