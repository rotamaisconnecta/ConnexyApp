import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { people } from "@/lib/mock-data";
import { personProximityLabel, personProximityRadius } from "@/lib/proximity";
import { PresenceDot } from "@/components/presence-dot";
import { X, Check, ChevronLeft } from "lucide-react";
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
  const p = Route.useLoaderData();
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
            {proximityLabel(p.distanceMeters)} · {proximityRadius(p.distanceMeters)} de você
          </p>
        </div>

        <div className="px-6 py-5 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Interesses em comum</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.interests.map((t: string) => (
              <span key={t} className="rounded-full bg-accent text-primary text-xs font-semibold px-3 py-1">{t}</span>
            ))}
          </div>
          {p.bio && <p className="mt-4 text-sm text-muted-foreground italic">"{p.bio}"</p>}
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
