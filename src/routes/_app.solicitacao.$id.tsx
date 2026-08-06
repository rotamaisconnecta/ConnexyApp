import { createFileRoute, Link, useNavigate, useRouter, notFound } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { people, commonGround, type Person } from "@/lib/mock-data";
import { personProximityLabel, personProximityRadius } from "@/lib/proximity";
import {
  getConversationId,
  getConversationInviteStatus,
  writeStoredInvite,
} from "@/lib/chat/mock-conversation-invites";
import { PresenceDot } from "@/components/presence-dot";
import { toast } from "sonner";
import { X, Check, ChevronLeft, UserRound, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Gradients } from "@/theme";
import { z } from "zod";

const searchSchema = z.object({
  mode: z.enum(["send", "receive"]).optional(),
});

export const Route = createFileRoute("/_app/solicitacao/$id")({
  head: () => ({ meta: [{ title: "Solicitação de chat — Connexy" }] }),
  validateSearch: searchSchema,
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
  const router = useRouter();
  const p = Route.useLoaderData() as Person;
  const { mode } = Route.useSearch();
  const cg = commonGround(p);

  const status = getConversationInviteStatus(p.id);
  const invited = status === "invited";
  const receive = !invited && mode === "receive";

  const title = invited
    ? "Convite enviado"
    : receive
      ? "Convite para conversar"
      : "Convidar para conversar";

  const support = invited
    ? `Aguardando uma resposta de ${p.name}.`
    : receive
      ? `${p.name} quer iniciar uma conversa com você.`
      : `Envie um convite para iniciar uma conversa com ${p.name}.`;

  const proximity = (() => {
    const label = personProximityLabel(p.distanceMeters);
    const radius = personProximityRadius(p.distanceMeters);
    return radius ? `${label} · ${radius} de você` : label;
  })();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
      return;
    }
    nav({ to: "/connecta" });
  }

  function sendInvite() {
    writeStoredInvite(p.id, "invited");
    toast.success(`Convite enviado para ${p.name}`);
    goBack();
  }

  function acceptInvite() {
    writeStoredInvite(p.id, "connected");
    const conversationId = getConversationId(p.id) ?? p.id;
    nav({ to: "/chat/$conversationId", params: { conversationId } });
  }

  function declineInvite() {
    writeStoredInvite(p.id, "rejected");
    goBack();
  }

  return (
    <div className="flex-1 flex flex-col relative" style={{ background: Gradients.soft }}>
      <StatusBar />
      <div className="flex items-center justify-between px-5 pt-1 pb-3">
        <BackButton
          fallbackTo="/connecta"
          className="h-9 w-9 grid place-items-center rounded-full bg-white/70 backdrop-blur"
        />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-6 rounded-3xl bg-surface shadow-elegant border border-border overflow-hidden flex-1 flex flex-col"
      >
        <div className="pt-8 pb-6 px-6 text-center bg-gradient-brand text-white">
          <div className="relative mx-auto h-24 w-24">
            <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-white/40">
              <img src={p.photo} alt={p.name} className="h-full w-full object-cover" />
            </div>
            <PresenceDot online={p.online} size={16} className="absolute bottom-1 right-1" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">{title}</h2>
          <p className="mt-1 text-sm opacity-90">{support}</p>
          <p className="mt-1 text-xs opacity-70">{proximity}</p>
        </div>

        <div className="px-6 py-5 flex-1 space-y-4">
          {cg.sharedInterests.length + cg.sharedVibe.length > 0 && (
            <div className="rounded-2xl bg-accent/60 border border-primary/20 p-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-primary">Terreno em comum</p>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {cg.sharedInterests.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-primary text-white text-[11px] font-semibold px-2.5 py-1"
                  >
                    {t}
                  </span>
                ))}
                {cg.sharedVibe.slice(0, 1).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-surface text-primary border border-primary/30 text-[11px] font-semibold px-2.5 py-1"
                  >
                    ✦ {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Interesses
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.interests.map((t: string) => (
                <span
                  key={t}
                  className="rounded-full bg-accent text-primary text-xs font-semibold px-3 py-1"
                >
                  {t}
                </span>
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
              <img
                src={p.photo}
                alt=""
                className="h-12 w-12 rounded-xl object-cover ring-2 ring-primary/30"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase font-bold text-primary tracking-wide">
                  Preview da bio pública
                </div>
                <div className="font-semibold text-sm truncate">
                  {p.headline ?? "Toque para ver a bio completa"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Momentos, interesses e locais favoritos
                </div>
              </div>
              <UserRound className="h-5 w-5 text-primary" />
            </div>
          </Link>
        </div>

        <div className="p-4">
          {invited ? (
            <button
              type="button"
              onClick={goBack}
              className="w-full h-14 rounded-2xl bg-secondary text-foreground font-semibold flex items-center justify-center gap-2"
            >
              <ChevronLeft className="h-5 w-5" /> Voltar
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={receive ? declineInvite : goBack}
                className="flex-1 h-14 rounded-2xl bg-secondary text-foreground font-semibold flex items-center justify-center gap-2"
              >
                <X className="h-5 w-5" /> {receive ? "Recusar" : "Agora não"}
              </button>
              <button
                type="button"
                onClick={receive ? acceptInvite : sendInvite}
                className="flex-1 h-14 rounded-2xl bg-gradient-brand text-white font-semibold shadow-elegant flex items-center justify-center gap-2"
              >
                <Check className="h-5 w-5" />
                {receive
                  ? "Aceitar conversa"
                  : status === "rejected"
                    ? "Enviar novo convite"
                    : "Enviar convite"}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <div className="h-6" />
    </div>
  );
}
