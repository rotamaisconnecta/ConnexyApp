import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { people, commonGround, type Person } from "@/lib/mock-data";
import { personProximityLabel, personProximityRadius } from "@/lib/proximity";
import { PresenceDot } from "@/components/presence-dot";
import { X, Check, ChevronLeft, UserRound, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/solicitacao/$id")({
  head: () => ({ meta: [{ title: "Solicitação de chat — Connecta" }] }),
  loader: ({ params }) => {
    const person = people.find((p) => p.id === params.id);
    if (!person) throw notFound();
    return person;
  },
  errorComponent: ({ error }) => <div className="p-6 text-sm">{error.message}</div>,
  notFoundComponent: () => <div className="p-6 text-sm">Pessoa não encontrada.</div>,
  component: Solicitacao,
});

function Solicitacao() {
  const nav = useNavigate();
  const p = Route.useLoaderData() as Person;
  const cg = commonGround(p);
  return (
    <div className="flex-1 flex flex-col relative"
         style={{ background: "linear-gradient(180deg, #efeaff 0%, #fff 60%)" }}>
      <StatusBar />
      <div className="flex items-center justify-between px-5 pt-1 pb-3">
        <Link to="/connecta" className="h-9 w-9 grid place-items-center rounded-full bg-white/70 backdrop-blur">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="mx-6 rounded-3xl bg-surface shadow-elegant border border-border overflow-hidden flex-1 flex flex-col">
        <div className="pt-8 pb-6 px-6 text-center bg-gradient-brand text-white">
          <div className="relative mx-auto h-24 w-24">
            <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-white/40">
              <img src={p.photo} alt={p.name} className="h-full w-full object-cover" />
            </div>
            <PresenceDot online={p.online} size={16} className="absolute bottom-1 right-1" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">{p.name} quer conversar com você!</h2>
          <p className="mt-1 text-sm opacity-90">
            {(() => {
              const label = personProximityLabel(p.distanceMeters);
              const radius = personProximityRadius(p.distanceMeters);
              return radius ? `${label} · ${radius} de você` : label;
            })()}
          </p>
        </div>

        <div className="px-6 py-5 flex-1 space-y-4">
          {(cg.sharedInterests.length + cg.sharedVibe.length > 0) && (
            <div className="rounded-2xl bg-accent/60 border border-primary/20 p-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-primary">Terreno em comum</p>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {cg.sharedInterests.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full bg-primary text-white text-[11px] font-semibold px-2.5 py-1">{t}</span>
                ))}
                {cg.sharedVibe.slice(0, 1).map((t) => (
                  <span key={t} className="rounded-full bg-surface text-primary border border-primary/30 text-[11px] font-semibold px-2.5 py-1">✦ {t}</span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Interesses</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.interests.map((t: string) => (
                <span key={t} className="rounded-full bg-accent text-primary text-xs font-semibold px-3 py-1">{t}</span>
              ))}
            </div>
          </div>
          {p.bio && <p className="text-sm text-muted-foreground italic">"{p.bio}"</p>}

          <Link
            to="/perfil/$id"
            params={{ id: p.id }}
            search={{ from: "solicitacao" }}
            className="block rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-accent/60 to-surface p-3 hover:border-primary/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <img src={p.photo} alt="" className="h-12 w-12 rounded-xl object-cover ring-2 ring-primary/30" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase font-bold text-primary tracking-wide">Preview da bio pública</div>
                <div className="font-semibold text-sm truncate">{p.headline ?? "Toque para ver a bio completa"}</div>
                <div className="text-[11px] text-muted-foreground">Momentos, interesses e locais favoritos</div>
              </div>
              <UserRound className="h-5 w-5 text-primary" />
            </div>
          </Link>

        </div>

        <div className="p-4 flex gap-3">
          <button onClick={() => nav({ to: "/connecta" })}
                  className="flex-1 h-14 rounded-2xl bg-secondary text-foreground font-semibold flex items-center justify-center gap-2">
            <X className="h-5 w-5" /> Recusar
          </button>
          <button onClick={() => nav({ to: "/chat/$id", params: { id: p.id } })}
                  className="flex-1 h-14 rounded-2xl bg-gradient-brand text-white font-semibold shadow-elegant flex items-center justify-center gap-2">
            <Check className="h-5 w-5" /> Aceitar
          </button>
        </div>
      </motion.div>

      <div className="h-6" />
    </div>
  );
}
