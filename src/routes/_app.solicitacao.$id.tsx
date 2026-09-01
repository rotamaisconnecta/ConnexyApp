import { createFileRoute, Link, useNavigate, useRouter, notFound } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { PresenceDot } from "@/components/presence-dot";
import { toast } from "sonner";
import { X, Check, ChevronLeft, UserRound, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Gradients } from "@/theme";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { ConnectionsService } from "@/services/connections.service";
import { DiscoveryService } from "@/services/discovery.service";
import { UserRepository } from "@/repositories/user.repository";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoMode } from "@/lib/demo/demo-config";
import { sendRequest, connectUser } from "@/lib/demo/demo-db";
import { useDemoIsConnected } from "@/lib/demo/use-demo-db";
import type { ProfileRow } from "@/types/database/tables";
import { people, type Person } from "@/lib/mock-data";
import { enginePersonById } from "@/lib/engine/engine-detail";
import { personProximityLabel, personProximityRadius } from "@/lib/proximity";

const searchSchema = z.object({
  mode: z.enum(["send", "receive"]).optional(),
});

export const Route = createFileRoute("/_app/solicitacao/$id")({
  head: () => ({ meta: [{ title: "Solicitação de chat — Connexy" }] }),
  validateSearch: searchSchema,
  component: Solicitacao,
});

interface ProfileData {
  name: string;
  photo_url: string | null;
  headline: string | null;
  interests: string[];
}

function Solicitacao() {
  const nav = useNavigate();
  const router = useRouter();
  const { id } = Route.useParams();
  const { mode } = Route.useSearch();
  const { user } = useAuth();
  const configured = isPublicSupabaseConfigured();
  const demo = isDemoMode();
  const demoConnected = useDemoIsConnected(id);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [status, setStatus] = useState<"loading" | "send" | "receive" | "sent" | "connected">(
    "loading",
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (demo && demoConnected) setStatus("connected");
  }, [demo, demoConnected]);

  useEffect(() => {
    if (!configured) {
      const mockPerson = people.find((p) => p.id === id) ?? enginePersonById(id);
      if (mockPerson) {
        setProfile({
          name: mockPerson.name,
          photo_url: mockPerson.photo,
          headline: mockPerson.headline ?? null,
          interests: mockPerson.interests,
        });
        setStatus(mode === "receive" ? "receive" : "send");
      }
      setIsLoadingProfile(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const p: ProfileRow = await UserRepository.getById(id);
        if (cancelled) return;
        setProfile({
          name: p.name ?? "Usuario",
          photo_url: p.photo_url,
          headline: p.headline ?? null,
          interests: p.interests ?? [],
        });

        if (user?.id) {
          const conversationId = await ConnectionsService.getDirectConversation(id);
          if (cancelled) return;
          if (conversationId) {
            setStatus("connected");
          } else if (mode === "receive") {
            const pending = await ConnectionsService.findIncomingPendingRequest(id);
            if (cancelled) return;
            setPendingRequestId(pending ?? null);
            setStatus("receive");
          } else {
            setStatus("send");
          }
        } else {
          setStatus(mode === "receive" ? "receive" : "send");
        }
      } catch {
        if (!cancelled) {
          setProfile({ name: "Usuario", photo_url: null, headline: null, interests: [] });
          setStatus(mode === "receive" ? "receive" : "send");
        }
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, id, user?.id, mode]);

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
      return;
    }
    nav({ to: "/connecta" });
  }

  async function sendInvite() {
    if (actionLoading) return;
    setActionLoading(true);
    if (demo) {
      sendRequest(id);
      setStatus("sent");
      toast.success(`Convite enviado para ${profile?.name ?? "essa pessoa"}`);
      goBack();
      setActionLoading(false);
      return;
    }
    if (!configured) {
      setActionLoading(false);
      return;
    }
    try {
      await ConnectionsService.sendRequest(id);
      setStatus("sent");
      toast.success(`Convite enviado para ${profile?.name ?? "essa pessoa"}`);
      goBack();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar o convite");
    } finally {
      setActionLoading(false);
    }
  }

  async function acceptInvite() {
    if (actionLoading) return;
    setActionLoading(true);
    if (demo) {
      connectUser(id);
      toast.success(`Conversa com ${profile?.name ?? "essa pessoa"} iniciada!`);
      nav({ to: "/chat/$conversationId", params: { conversationId: id } });
      setActionLoading(false);
      return;
    }
    if (!configured) {
      setActionLoading(false);
      return;
    }
    try {
      const requestId =
        pendingRequestId ?? (await ConnectionsService.findIncomingPendingRequest(id));
      if (!requestId) {
        toast.error("Nenhum convite pendente encontrado");
        return;
      }
      await ConnectionsService.acceptRequest(requestId);
      const conversationId = await ConnectionsService.getDirectConversation(id);
      toast.success(`Conversa com ${profile?.name ?? "essa pessoa"} iniciada!`);
      nav({ to: "/chat/$conversationId", params: { conversationId: conversationId ?? id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível aceitar o convite");
    } finally {
      setActionLoading(false);
    }
  }

  async function declineInvite() {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      goBack();
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="flex-1 flex flex-col relative" style={{ background: Gradients.soft }}>
        <StatusBar />
        <div className="flex items-center justify-between px-5 pt-1 pb-3">
          <BackButton
            fallbackTo="/connecta"
            className="h-9 w-9 grid place-items-center rounded-full bg-white/70 backdrop-blur"
          />
        </div>
        <div className="mx-6 rounded-3xl bg-surface shadow-elegant border border-border overflow-hidden flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="mt-2 text-xs text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col relative" style={{ background: Gradients.soft }}>
        <StatusBar />
        <div className="flex items-center justify-between px-5 pt-1 pb-3">
          <BackButton
            fallbackTo="/connecta"
            className="h-9 w-9 grid place-items-center rounded-full bg-white/70 backdrop-blur"
          />
        </div>
        <div className="mx-6 rounded-3xl bg-surface shadow-elegant border border-border overflow-hidden flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-xs text-muted-foreground">Pessoa não encontrada.</p>
        </div>
      </div>
    );
  }

  const invited = status === "sent";
  const receive = status === "receive";
  const connected = status === "connected";

  const title = invited
    ? "Convite enviado"
    : receive
      ? "Convite para conversar"
      : connected
        ? "Já conectado"
        : "Convidar para conversar";

  const support = invited
    ? `Aguardando uma resposta de ${profile.name}.`
    : receive
      ? `${profile.name} quer iniciar uma conversa com você.`
      : connected
        ? `Você já está conectado com ${profile.name}.`
        : `Envie um convite para iniciar uma conversa com ${profile.name}.`;

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
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/20">
                  <span className="text-3xl font-bold text-white">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">{title}</h2>
          <p className="mt-1 text-sm opacity-90">{support}</p>
        </div>

        <div className="px-6 py-5 flex-1 space-y-4">
          {profile.interests.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Interesses
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.interests.slice(0, 5).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-accent text-primary text-xs font-semibold px-3 py-1"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.headline && (
            <p className="text-sm text-muted-foreground italic">"{profile.headline}"</p>
          )}

          <Link
            to="/perfil/$id"
            params={{ id }}
            search={{ from: "solicitacao" }}
            className="block rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-accent/60 to-surface p-3 hover:border-primary/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover ring-2 ring-primary/30"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-2 ring-primary/30">
                  <UserRound className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase font-bold text-primary tracking-wide">
                  Preview da bio pública
                </div>
                <div className="font-semibold text-sm truncate">
                  {profile.headline ?? "Toque para ver a bio completa"}
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
          {connected ? (
            <button
              type="button"
              onClick={() => {
                if (demo) {
                  nav({ to: "/chat/$conversationId", params: { conversationId: id } });
                  return;
                }
                void (async () => {
                  try {
                    const cid = await ConnectionsService.getDirectConversation(id);
                    nav({ to: "/chat/$conversationId", params: { conversationId: cid ?? id } });
                  } catch {
                    nav({ to: "/chat/$conversationId", params: { conversationId: id } });
                  }
                })();
              }}
              className="w-full h-14 rounded-2xl bg-gradient-brand text-white font-semibold flex items-center justify-center gap-2"
            >
              Conversar
            </button>
          ) : invited ? (
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
                disabled={actionLoading}
                className="flex-1 h-14 rounded-2xl bg-secondary text-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <X className="h-5 w-5" /> {receive ? "Recusar" : "Agora não"}
              </button>
              <button
                type="button"
                onClick={receive ? acceptInvite : sendInvite}
                disabled={actionLoading}
                className="flex-1 h-14 rounded-2xl bg-gradient-brand text-white font-semibold shadow-elegant flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                {receive ? "Aceitar conversa" : actionLoading ? "Enviando..." : "Enviar convite"}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <div className="h-6" />
    </div>
  );
}
