import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";

const PROMO_ID = "cafe-central-20off";

function getDismissKey(userId: string | null): string {
  return `connexy:dismissed-promotion:${userId ?? "anon"}:${PROMO_ID}`;
}

function isDismissed(userId: string | null): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(getDismissKey(userId)) === "1";
  } catch {
    return false;
  }
}

function dismiss(userId: string | null): void {
  try {
    localStorage.setItem(getDismissKey(userId), "1");
  } catch {
    // Storage unavailable — ignore silently.
  }
}

export function PromoPopup() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const configured = isPublicSupabaseConfigured();
  const [open, setOpen] = useState(false);

  const userId = configured && user ? user.id : null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathname.startsWith("/home")) return;
    if (isDismissed(userId)) return;
    const t = setTimeout(() => setOpen(true), 3500);
    return () => clearTimeout(t);
  }, [pathname, userId]);

  const close = () => {
    setOpen(false);
    dismiss(userId);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mx-5 mb-4"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-brand p-4 text-white shadow-elegant">
            <button
              type="button"
              onClick={close}
              aria-label="Fechar promoção"
              className="absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider opacity-90">
                  Promoção perto de você
                </p>
                <p className="font-display text-sm font-bold leading-snug">
                  Você está a 150 m de uma oferta especial
                </p>
                <p className="mt-0.5 text-xs opacity-90 truncate">
                  Café Central — 20% OFF em cafés especiais
                </p>
                <div className="mt-2 flex gap-2">
                  <Link
                    to="/local/$id"
                    params={{ id: "cafe-central" }}
                    onClick={close}
                    className="rounded-full bg-white text-primary text-[11px] font-semibold px-3 py-1.5 shadow-soft"
                  >
                    Ver oferta
                  </Link>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full bg-white/15 text-white text-[11px] font-semibold px-3 py-1.5"
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
