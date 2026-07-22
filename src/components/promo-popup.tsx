import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";

const KEY = "rmc:promo-dismissed";

export function PromoPopup() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(KEY)) return;
    if (!pathname.startsWith("/home") && !pathname.startsWith("/rota")) return;
    const t = setTimeout(() => setOpen(true), 3500);
    return () => clearTimeout(t);
  }, [pathname]);

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined") sessionStorage.setItem(KEY, "1");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="absolute inset-x-3 bottom-24 z-40"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-brand p-4 text-white shadow-elegant">
            <button
              onClick={close}
              className="absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-full bg-white/15 hover:bg-white/25"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-wider opacity-90">
                  Promoção perto de você
                </p>
                <p className="font-display text-lg font-semibold leading-tight">
                  Você está a 150 m de uma oferta especial
                </p>
                <p className="mt-1 text-sm opacity-90">Café Central — 20% OFF em cafés especiais</p>
                <div className="mt-3 flex gap-2">
                  <Link
                    to="/local/$id"
                    params={{ id: "cafe-central" }}
                    onClick={close}
                    className="rounded-full bg-white text-primary text-xs font-semibold px-3 py-1.5 shadow-soft"
                  >
                    Ver oferta
                  </Link>
                  <button
                    onClick={close}
                    className="rounded-full bg-white/15 text-white text-xs font-semibold px-3 py-1.5"
                  >
                    Agora não
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
