import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";

const PROMO_ID = "cafe-central-20off";
const DAILY_IMPRESSION_LIMIT = 3;

interface DailyPromoUsage {
  date: string;
  impressions: number;
}

function getUsageKey(userId: string | null): string {
  return `connexy:promotion-usage:${userId ?? "anon"}:${PROMO_ID}`;
}

function localDateKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function readUsage(userId: string | null): DailyPromoUsage {
  const empty = { date: localDateKey(), impressions: 0 };
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(getUsageKey(userId));
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<DailyPromoUsage>;
    if (parsed.date !== empty.date || typeof parsed.impressions !== "number") return empty;
    return { date: empty.date, impressions: Math.max(0, parsed.impressions) };
  } catch {
    return empty;
  }
}

function registerImpression(userId: string | null): boolean {
  const usage = readUsage(userId);
  if (usage.impressions >= DAILY_IMPRESSION_LIMIT) return false;
  try {
    localStorage.setItem(
      getUsageKey(userId),
      JSON.stringify({ ...usage, impressions: usage.impressions + 1 }),
    );
  } catch {
    // Storage unavailable: the promotion may be shown again on a future visit.
  }
  return true;
}

export function PromoPopup() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user } = useAuth();
  const configured = isPublicSupabaseConfigured();
  const shownThisMount = useRef(false);
  const [open, setOpen] = useState(false);

  const userId = configured && user ? user.id : null;

  useEffect(() => {
    if (typeof window === "undefined" || shownThisMount.current) return;
    if (!pathname.startsWith("/home")) return;
    if (readUsage(userId).impressions >= DAILY_IMPRESSION_LIMIT) return;

    const timer = window.setTimeout(() => {
      if (!registerImpression(userId)) return;
      shownThisMount.current = true;
      setOpen(true);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [pathname, userId]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Sugestão patrocinada perto de você"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/20 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-[390px] overflow-hidden rounded-[30px] border border-white/60 bg-white/85 p-5 text-gray-950 shadow-2xl backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-pink/20 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600">
                  <Sparkles className="h-3 w-3 text-primary" /> Patrocinado
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar sugestão"
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/5 text-gray-600 transition-colors hover:bg-black/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-7 text-xs font-semibold text-primary">Perto de você</p>
              <h2 className="mt-1 max-w-[300px] font-display text-[28px] font-bold leading-[1.05] tracking-[-0.03em]">
                Uma pausa especial no Café Central.
              </h2>
              <p className="mt-3 max-w-[310px] text-sm leading-relaxed text-gray-600">
                Ganhe 20% de desconto em cafés especiais hoje.
              </p>

              <div className="mt-7 flex items-center gap-3">
                <Link
                  to="/local/$id"
                  params={{ id: "cafe-central" }}
                  onClick={() => setOpen(false)}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-gray-950 px-5 text-sm font-semibold text-white shadow-lg transition-transform active:scale-[0.98]"
                >
                  Ver oferta <ArrowUpRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-12 rounded-full bg-black/5 px-5 text-sm font-semibold text-gray-700 transition-colors hover:bg-black/10"
                >
                  Agora não
                </button>
              </div>

              <p className="mt-4 text-center text-[10px] text-gray-500">
                Sugestões patrocinadas aparecem no máximo 3 vezes por dia.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
