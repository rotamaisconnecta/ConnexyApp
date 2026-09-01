import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { toast } from "sonner";
import { Check, Loader2, MessageCircle, Send, UserRound, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { ConnectionsService } from "@/services/connections.service";
import { UserRepository } from "@/repositories/user.repository";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoMode } from "@/lib/demo/demo-config";
import { connectUser, declineRequest, hasPendingRequest, sendRequest } from "@/lib/demo/demo-db";
import { useDemoIsConnected } from "@/lib/demo/use-demo-db";
import type { ProfileRow } from "@/types/database/tables";
import { people } from "@/lib/mock-data";
import { enginePersonById } from "@/lib/engine/engine-detail";
import { formatPersonDistance } from "@/lib/proximity";

const searchSchema = z.object({
  mode: z.enum(["send", "receive"]).optional(),
});

export const Route = createFileRoute("/_app/solicitacao/$id")({
  head: () => ({ meta: [{ title: "Solicitação de conversa — Connexy" }] }),
  validateSearch: searchSchema,
  component: Solicitacao,
});

type RequestStatus = "loading" | "send" | "receive" | "sent" | "connected";

interface ProfileData {
  name: string;
  photo_url: string | null;
  headline: string | null;
  interests: string[];
  age: number | null;
  distanceMeters: number | null;
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
  const [status, setStatus] = useState<RequestStatus>("loading");
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (demo && demoConnected) setStatus("connected");
  }, [demo, demoConnected]);

  useEffect(() => {
    if (!configured) {
      const nearbyPerson = people.find((person) => person.id === id);
      const mockPerson = nearbyPerson ?? enginePersonById(id);
      if (mockPerson) {
        setProfile({
          name: mockPerson.name,
          photo_url: mockPerson.photo,
          headline: mockPerson.headline ?? null,
          interests: mockPerson.interests,
          age: nearbyPerson?.age ?? null,
          distanceMeters: nearbyPerson?.distanceMeters ?? null,
        });
        setStatus(
          demo && demoConnected
            ? "connected"
            : mode === "receive"
              ? "receive"
              : demo && hasPendingRequest(id)
                ? "sent"
                : "send",
        );
      }
      setIsLoadingProfile(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const result: ProfileRow = await UserRepository.getById(id);
        if (cancelled) return;
        const profileWithAge = result as ProfileRow & { age?: number | null };
        setProfile({
          name: result.name ?? "Usuário",
          photo_url: result.photo_url,
          headline: result.headline ?? null,
          interests: result.interests ?? [],
          age: profileWithAge.age ?? null,
          distanceMeters: null,
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
          setProfile({
            name: "Usuário",
            photo_url: null,
            headline: null,
            interests: [],
            age: null,
            distanceMeters: null,
          });
          setStatus(mode === "receive" ? "receive" : "send");
        }
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, demo, demoConnected, id, mode, user?.id]);

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
      return;
    }
    nav({ to: "/perfil/$id", params: { id } });
  }

  async function sendInvite() {
    if (actionLoading) return;
    setActionLoading(true);
    if (demo) {
      sendRequest(id);
      setStatus("sent");
      toast.success(`Solicitação enviada para ${profile?.name ?? "essa pessoa"}`);
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
      toast.success(`Solicitação enviada para ${profile?.name ?? "essa pessoa"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a solicitação");
    } finally {
      setActionLoading(false);
    }
  }

  async function acceptInvite() {
    if (actionLoading) return;
    setActionLoading(true);
    if (demo) {
      connectUser(id);
      toast.success(`${profile?.name ?? "Essa pessoa"} agora está nas suas conversas.`);
      nav({ to: "/chat" });
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
        toast.error("Nenhuma solicitação pendente encontrada");
        return;
      }
      await ConnectionsService.acceptRequest(requestId);
      toast.success(`${profile?.name ?? "Essa pessoa"} agora está nas suas conversas.`);
      nav({ to: "/chat" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível aceitar a solicitação");
    } finally {
      setActionLoading(false);
    }
  }

  async function declineInvite() {
    if (actionLoading) return;
    setActionLoading(true);
    if (demo) {
      declineRequest(id);
      toast.success("Solicitação recusada.");
      goBack();
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
        toast.error("Nenhuma solicitação pendente encontrada");
        return;
      }
      await ConnectionsService.rejectRequest(requestId);
      toast.success("Solicitação recusada.");
      goBack();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível recusar a solicitação");
    } finally {
      setActionLoading(false);
    }
  }

  async function openConversation() {
    if (demo) {
      nav({ to: "/chat/$conversationId", params: { conversationId: id } });
      return;
    }
    try {
      const conversationId = await ConnectionsService.getDirectConversation(id);
      nav({
        to: "/chat/$conversationId",
        params: { conversationId: conversationId ?? id },
      });
    } catch {
      nav({ to: "/chat/$conversationId", params: { conversationId: id } });
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="grid h-full min-h-[620px] place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="grid h-full min-h-[620px] place-items-center bg-background px-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Pessoa não encontrada.</p>
          <button type="button" onClick={goBack} className="mt-4 text-sm font-semibold text-primary">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const receive = status === "receive";
  const sent = status === "sent";
  const connected = status === "connected";
  const firstName = profile.name.split(" ")[0];
  const ageLabel = profile.age ? `, ${profile.age}` : "";
  const proximity =
    profile.distanceMeters != null ? formatPersonDistance(profile.distanceMeters) : "Perto de você";
  const interestText = profile.interests.slice(0, 2).join(" e ").toLowerCase();
  const invitationText = receive
    ? `Oi! Vi que temos interesses como ${interestText || "novas experiências"}. Gostaria de começar uma conversa com você. 💜`
    : `Oi, ${firstName}! Vi que você curte ${interestText || "descobrir coisas novas"}. Também amo descobrir novos lugares para boas conversas. 💜`;

  const title = connected
    ? "Vocês já podem conversar"
    : sent
      ? "Solicitação enviada"
      : receive
        ? `${firstName} quer conversar com você`
        : "Começar uma conversa?";

  const support = connected
    ? `${firstName} já está disponível na sua tela de conversas.`
    : sent
      ? `${firstName} poderá aceitar ou recusar o seu convite.`
      : receive
        ? "Leia a mensagem e decida se deseja iniciar essa conexão."
        : `${firstName} poderá aceitar ou recusar seu convite.`;

  return (
    <div className="relative h-full min-h-[620px] overflow-hidden bg-gray-950">
      <div className="absolute inset-0">
        {profile.photo_url ? (
          <img src={profile.photo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-brand text-7xl font-bold text-white">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/80" />
      </div>

      <div className="relative z-10">
        <StatusBar dark />
        <div className="px-5 pt-4 text-white">
          <h1 className="font-display text-2xl font-bold">
            {profile.name}
            {ageLabel}
          </h1>
          <p className="mt-1 text-sm text-white/85">{proximity}</p>
        </div>
      </div>

      <motion.section
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="absolute inset-x-0 bottom-0 z-20 flex max-h-[76%] flex-col overflow-visible rounded-t-[32px] bg-white text-gray-950 shadow-2xl"
      >
        <div className="relative shrink-0 px-5 pb-3 pt-10 text-center">
          <div className="absolute left-1/2 top-0 h-16 w-16 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[3px] border-white bg-gray-100 shadow-lg">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-primary">
                <UserRound className="h-6 w-6" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={goBack}
            aria-label="Fechar solicitação"
            className="absolute right-4 top-3 grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-gray-500"
          >
            <X className="h-4 w-4" />
          </button>

          <h2 className="font-display text-xl font-bold tracking-[-0.02em]">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{support}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
          {!connected && !sent && (
            <div className="rounded-2xl bg-primary/[0.08] px-4 py-3 text-left text-sm leading-relaxed text-primary">
              <span className="mr-2 text-xl font-bold" aria-hidden>
                “
              </span>
              {invitationText}
            </div>
          )}

          {sent && (
            <div className="grid place-items-center rounded-2xl bg-primary/[0.08] px-4 py-5 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                <Send className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-primary">Aguardando resposta</p>
              <p className="mt-1 text-xs text-gray-500">
                A conversa só será criada se {firstName} aceitar.
              </p>
            </div>
          )}

          {connected && (
            <div className="grid place-items-center rounded-2xl bg-emerald-50 px-4 py-5 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-emerald-700">Conexão aceita</p>
              <p className="mt-1 text-xs text-emerald-700/70">
                Vocês agora podem trocar mensagens.
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-4">
          {connected ? (
            <button
              type="button"
              onClick={openConversation}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand text-sm font-semibold text-white shadow-elegant"
            >
              <MessageCircle className="h-4 w-4" /> Conversar agora
            </button>
          ) : sent ? (
            <button
              type="button"
              onClick={goBack}
              className="h-12 w-full rounded-2xl border border-primary/30 text-sm font-semibold text-primary"
            >
              Voltar ao perfil
            </button>
          ) : receive ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={acceptInvite}
                disabled={actionLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand text-sm font-semibold text-white shadow-elegant disabled:opacity-60"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Aceitar e conversar
              </button>
              <button
                type="button"
                onClick={declineInvite}
                disabled={actionLoading}
                className="h-11 w-full rounded-2xl border border-gray-200 text-sm font-semibold text-primary disabled:opacity-60"
              >
                Recusar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={sendInvite}
                disabled={actionLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand text-sm font-semibold text-white shadow-elegant disabled:opacity-60"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {actionLoading ? "Enviando..." : "Enviar solicitação"}
              </button>
              <button
                type="button"
                onClick={goBack}
                disabled={actionLoading}
                className="h-11 w-full rounded-2xl border border-gray-200 text-sm font-semibold text-primary disabled:opacity-60"
              >
                Agora não
              </button>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
