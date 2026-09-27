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
import { isRemoteSocialEnabled } from "@/lib/social/schema-a-social-flag";
import { canRemoteSocialTarget, getSchemaASocial } from "@/lib/social/schema-a-social";
import {
  acceptRequest,
  declineRequest,
  getConnectionBetween,
  sendRequest,
} from "@/lib/demo/demo-db";
import {
  useDemoIsConnected,
  useDemoOutgoingRequest,
  useDemoPendingRequests,
} from "@/lib/demo/use-demo-db";
import type { ProfileRow } from "@/types/database/tables";
import { currentUser, people } from "@/lib/mock-data";
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

function suggestedInvitation(name: string, interests: string[]): string {
  const firstName = name.split(" ")[0];
  const interestText = interests.slice(0, 2).join(" e ").toLowerCase();
  return `Oi, ${firstName}! Vi que você curte ${interestText || "descobrir coisas novas"}. Gostaria de conversar e conhecer um pouco mais sobre você. 💜`;
}

function Solicitacao() {
  const nav = useNavigate();
  const router = useRouter();
  const { id } = Route.useParams();
  const { mode } = Route.useSearch();
  const { user } = useAuth();
  const configured = isPublicSupabaseConfigured();
  const demo = isDemoMode();
  const remote = isRemoteSocialEnabled();
  const demoConnected = useDemoIsConnected(id, user?.id);
  const outgoingRequest = useDemoOutgoingRequest(user?.id, id);
  const incomingRequests = useDemoPendingRequests(user?.id);
  const incomingRequest = incomingRequests.find((request) => request.fromUserId === id) ?? null;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [status, setStatus] = useState<RequestStatus>("loading");
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [invitationMessage, setInvitationMessage] = useState("");

  useEffect(() => {
    if (demo && demoConnected) setStatus("connected");
  }, [demo, demoConnected]);

  useEffect(() => {
    if (!canRemoteSocialTarget(id)) return;
    let cancelled = false;
    void (async () => {
      try {
        const social = getSchemaASocial();
        if (await social.isConnected(id)) {
          if (!cancelled) setStatus("connected");
          return;
        }
        if (mode === "receive") {
          const incoming = await social.incomingPendingFrom(id);
          if (cancelled) return;
          setPendingRequestId(incoming?.id ?? null);
          setStatus(incoming ? "receive" : "send");
          return;
        }
        const outgoing = await social.outgoingPendingTo(id);
        if (cancelled) return;
        setStatus(outgoing ? "sent" : "send");
      } catch {
        if (!cancelled) setStatus(mode === "receive" ? "receive" : "send");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, mode, remote]);

  useEffect(() => {
    if (remote) {
      const nearbyPerson = people.find((person) => person.id === id);
      const mockPerson = nearbyPerson ?? enginePersonById(id) ?? null;
      if (mockPerson) {
        setProfile({
          name: mockPerson.name,
          photo_url: mockPerson.photo,
          headline: mockPerson.headline ?? null,
          interests: mockPerson.interests,
          age: nearbyPerson?.age ?? null,
          distanceMeters: nearbyPerson?.distanceMeters ?? null,
        });
      } else {
        setProfile({
          name: "Pessoa",
          photo_url: null,
          headline: null,
          interests: [],
          age: null,
          distanceMeters: null,
        });
      }
      setInvitationMessage("");
      setIsLoadingProfile(false);
      return;
    }
    if (!configured) {
      const nearbyPerson = people.find((person) => person.id === id);
      const identityPerson =
        id === currentUser.id
          ? {
              id: currentUser.id,
              name: currentUser.name,
              photo: currentUser.photo,
              headline: currentUser.bio,
              interests: currentUser.interests,
              age: null,
              distanceMeters: 0,
            }
          : null;
      const mockPerson = nearbyPerson ?? enginePersonById(id) ?? identityPerson;
      if (mockPerson) {
        const pendingRequest = demo && mode === "receive" ? incomingRequest : outgoingRequest;
        setProfile({
          name: mockPerson.name,
          photo_url: mockPerson.photo,
          headline: mockPerson.headline ?? null,
          interests: mockPerson.interests,
          age: nearbyPerson?.age ?? null,
          distanceMeters: nearbyPerson?.distanceMeters ?? null,
        });
        setInvitationMessage(
          pendingRequest?.message || suggestedInvitation(mockPerson.name, mockPerson.interests),
        );
        setStatus(
          demo && demoConnected
            ? "connected"
            : mode === "receive" && incomingRequest
              ? "receive"
              : demo && outgoingRequest
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
        setInvitationMessage(suggestedInvitation(result.name ?? "Usuário", result.interests ?? []));

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
          setInvitationMessage("Olá! Gostaria de começar uma conversa com você. 💜");
          setStatus(mode === "receive" ? "receive" : "send");
        }
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    configured,
    demo,
    demoConnected,
    id,
    incomingRequest,
    mode,
    outgoingRequest,
    remote,
    user?.id,
  ]);

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
      return;
    }
    nav({ to: "/perfil/$id", params: { id } });
  }

  async function sendInvite() {
    if (actionLoading) return;
    const message = invitationMessage.trim();
    setActionLoading(true);
    if (remote) {
      try {
        if (!canRemoteSocialTarget(id)) {
          throw new Error("Este perfil demo não entra no grafo Social remoto.");
        }
        await getSchemaASocial().sendRequest(id);
        setStatus("sent");
        toast.success(`Solicitação enviada para ${profile?.name ?? "essa pessoa"}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível enviar o convite.");
      }
      setActionLoading(false);
      return;
    }
    if (demo) {
      if (!message) {
        toast.error("Escreva uma mensagem antes de enviar.");
        setActionLoading(false);
        return;
      }
      try {
        if (!user?.id) throw new Error("Identidade local indisponível.");
        sendRequest(user.id, id, message);
        setStatus("sent");
        toast.success(`Solicitação enviada para ${profile?.name ?? "essa pessoa"}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível enviar o convite.");
      }
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
    if (remote) {
      try {
        if (!canRemoteSocialTarget(id)) {
          throw new Error("Este perfil demo não entra no grafo Social remoto.");
        }
        const incoming = pendingRequestId ?? (await getSchemaASocial().incomingPendingFrom(id))?.id;
        if (!incoming) {
          toast.error("Nenhuma solicitação pendente encontrada");
          return;
        }
        const accepted = await getSchemaASocial().acceptRequest(incoming);
        if (accepted.connection.conversationId) {
          throw new Error("Connection remota não deve criar conversa.");
        }
        setStatus("connected");
        toast.success(`${profile?.name ?? "Essa pessoa"} agora faz parte das suas conexões.`);
        nav({ to: "/perfil/$id", params: { id } });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível aceitar o convite.");
      } finally {
        setActionLoading(false);
      }
      return;
    }
    if (demo) {
      try {
        if (!user?.id) throw new Error("Identidade local indisponível.");
        const connection = await acceptRequest(id, user.id);
        toast.success(`${profile?.name ?? "Essa pessoa"} agora está nas suas conversas.`);
        nav({
          to: "/chat/$conversationId",
          params: { conversationId: connection.conversationId },
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível aceitar o convite.");
      } finally {
        setActionLoading(false);
      }
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
      const conversationId = await ConnectionsService.getDirectConversation(id);
      toast.success(`${profile?.name ?? "Essa pessoa"} agora está nas suas conversas.`);
      nav({
        to: "/chat/$conversationId",
        params: { conversationId: conversationId ?? id },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível aceitar a solicitação",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function declineInvite() {
    if (actionLoading) return;
    setActionLoading(true);
    if (remote) {
      try {
        if (!canRemoteSocialTarget(id)) {
          throw new Error("Este perfil demo não entra no grafo Social remoto.");
        }
        const incoming = pendingRequestId ?? (await getSchemaASocial().incomingPendingFrom(id))?.id;
        if (!incoming) {
          toast.error("Nenhuma solicitação pendente encontrada");
          return;
        }
        await getSchemaASocial().declineRequest(incoming);
        toast.success("Solicitação recusada.");
        goBack();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível recusar o convite.");
      } finally {
        setActionLoading(false);
      }
      return;
    }
    if (demo) {
      if (user?.id) {
        declineRequest(id, user.id);
        toast.success("Solicitação recusada.");
        goBack();
      }
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
      toast.error(
        error instanceof Error ? error.message : "Não foi possível recusar a solicitação",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function openConversation() {
    if (remote) {
      nav({ to: "/perfil/$id", params: { id } });
      return;
    }
    if (demo) {
      const conversationId = user?.id ? getConnectionBetween(user.id, id)?.conversationId : null;
      nav({ to: "/chat/$conversationId", params: { conversationId: conversationId ?? id } });
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
      <div className="grid h-full place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="grid h-full place-items-center bg-background px-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Pessoa não encontrada.</p>
          <button
            type="button"
            onClick={goBack}
            className="mt-4 text-sm font-semibold text-primary"
          >
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

  const title = connected
    ? remote
      ? "Vocês estão conectados"
      : "Vocês já podem conversar"
    : sent
      ? "Solicitação enviada"
      : receive
        ? remote
          ? `${firstName} quer se conectar com você`
          : `${firstName} quer conversar com você`
        : remote
          ? "Começar uma conexão?"
          : "Começar uma conversa?";

  const support = connected
    ? remote
      ? "A conexão foi salva. Nenhuma conversa foi criada automaticamente."
      : `${firstName} já está disponível na sua tela de conversas.`
    : sent
      ? remote
        ? `${firstName} poderá aceitar ou recusar. Aceitar cria só a conexão.`
        : `${firstName} poderá aceitar ou recusar o seu convite.`
      : receive
        ? remote
          ? "Aceitar cria uma Connection. Nenhuma conversa é aberta automaticamente."
          : "Leia a mensagem e decida se deseja iniciar essa conexão."
        : `${firstName} poderá aceitar ou recusar seu convite.`;

  return (
    <div className="relative h-full overflow-hidden bg-gray-950">
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
        className="absolute inset-x-0 bottom-0 z-20 flex max-h-[78%] flex-col overflow-hidden rounded-t-[32px] bg-white text-gray-950 shadow-2xl"
      >
        <div className="relative shrink-0 px-5 pb-3 pt-20 text-center">
          <div className="absolute left-1/2 top-3 h-16 w-16 -translate-x-1/2 overflow-hidden rounded-full border-[3px] border-white bg-gray-100 shadow-lg">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
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
          {!connected &&
            !sent &&
            !remote &&
            (receive ? (
              <div className="rounded-2xl bg-primary/[0.08] px-4 py-3 text-left text-sm leading-relaxed text-primary">
                <span className="mr-2 text-xl font-bold" aria-hidden>
                  “
                </span>
                {invitationMessage || "Olá! Gostaria de começar uma conversa com você. 💜"}
              </div>
            ) : (
              <div>
                <label
                  htmlFor="conversation-invitation"
                  className="mb-2 block text-left text-xs font-semibold text-gray-600"
                >
                  Sua mensagem
                </label>
                <textarea
                  id="conversation-invitation"
                  value={invitationMessage}
                  onChange={(event) => setInvitationMessage(event.target.value.slice(0, 240))}
                  maxLength={240}
                  rows={4}
                  aria-describedby="conversation-invitation-count"
                  className="w-full resize-none rounded-2xl border border-primary/20 bg-primary/[0.06] px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                />
                <p
                  id="conversation-invitation-count"
                  className="mt-1.5 text-right text-[11px] text-gray-400"
                >
                  {invitationMessage.length}/240
                </p>
              </div>
            ))}

          {sent && (
            <div className="grid place-items-center rounded-2xl bg-primary/[0.08] px-4 py-5 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                <Send className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-primary">Aguardando resposta</p>
              <p className="mt-1 text-xs text-gray-500">
                {remote
                  ? `Aceitar cria só a conexão. Nenhuma conversa será aberta.`
                  : `A conversa só será criada se ${firstName} aceitar.`}
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
                {remote
                  ? "Nenhuma conversa foi criada automaticamente."
                  : "Vocês agora podem trocar mensagens."}
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white px-5 pb-4 pt-4">
          {connected ? (
            <button
              type="button"
              onClick={openConversation}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand text-sm font-semibold text-white shadow-elegant"
            >
              <MessageCircle className="h-4 w-4" /> {remote ? "Ver perfil" : "Conversar agora"}
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
                {remote ? "Aceitar conexão" : "Aceitar e conversar"}
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
