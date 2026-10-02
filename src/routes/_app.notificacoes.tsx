import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { resolveDemoCatalogPerson } from "@/lib/chat/functional-conversation-list";
import { useState } from "react";
import { MapPin, MessageCircle, Users } from "lucide-react";
import { isDemoMode } from "@/lib/demo/demo-config";
import { useAuth } from "@/hooks/use-auth";
import { listLocalInboxItems, type LocalInboxItem } from "@/lib/notifications/local-invite-inbox";
import { useDemoGroupInvites, useDemoPendingRequests } from "@/lib/demo/use-demo-db";
import {
  OutingInviteStatus,
  useOutingInviteVersion,
} from "@/lib/marketplace/outing-invites";
import { respondToRideFriendInvite } from "@/lib/mobility/ride-companions";

const tabs = ["Todas", "Social", "Viagens", "Promoções"] as const;

export const Route = createFileRoute("/_app/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — Connexy" }] }),
  component: Notifs,
});

function visibleInboxItems(tab: (typeof tabs)[number], items: LocalInboxItem[]): LocalInboxItem[] {
  if (tab === "Todas") return items;
  if (tab === "Social") {
    return items.filter(
      (item) => item.kind === "conversation_invite" || item.kind === "group_invite",
    );
  }
  if (tab === "Viagens") return items.filter((item) => item.kind === "outing_invite");
  return [];
}

function Notifs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Todas");
  useDemoPendingRequests(user?.id);
  useDemoGroupInvites(user?.id ?? "");
  const outingVersion = useOutingInviteVersion();
  void outingVersion;
  const inboxItems = isDemoMode() && user?.id ? listLocalInboxItems(user.id) : [];
  const visibleItems = visibleInboxItems(tab, inboxItems);

  return (
    <div className="flex-1">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <BackButton
          fallbackTo="/home"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <h1 className="font-display font-bold text-lg">Notificações</h1>
      </header>

      <div className="px-5 flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            data-notification-tab={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold ${tab === t ? "bg-gradient-brand text-white" : "bg-secondary text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <ul className="mt-4 px-5 space-y-2 pb-4">
        {visibleItems.map((item) => {
          if (item.kind === "conversation_invite") {
            const person = resolveDemoCatalogPerson(item.fromUserId);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  data-inbox-kind="conversation_invite"
                  data-request-id={item.requestId}
                  onClick={() =>
                    navigate({
                      to: "/solicitacao/$id",
                      params: { id: item.fromUserId },
                      search: { mode: "receive" },
                    })
                  }
                  className="flex w-full items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] p-3 text-left transition active:scale-[0.99]"
                >
                  {person?.photo ? (
                    <img
                      src={person.photo}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      {person?.name ?? "Alguém"} quer conversar com você
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                      {item.message || "Toque para ver e responder à solicitação."}
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold text-primary">
                      Ver solicitação
                    </span>
                  </span>
                </button>
              </li>
            );
          }

          if (item.kind === "group_invite") {
            return (
              <li key={item.id}>
                <button
                  type="button"
                  data-inbox-kind="group_invite"
                  data-group-id={item.groupId}
                  onClick={() =>
                    navigate({
                      to: "/chat/$conversationId",
                      params: { conversationId: item.groupId },
                    })
                  }
                  className="flex w-full items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] p-3 text-left transition active:scale-[0.99]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      Convite para {item.name}
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                      Toque para abrir o grupo e responder ao convite.
                    </span>
                    <span className="mt-1 block text-[11px] font-semibold text-primary">
                      Ver convite
                    </span>
                  </span>
                </button>
              </li>
            );
          }

          const person = resolveDemoCatalogPerson(item.fromUserId);
          const pending = item.status === OutingInviteStatus.PENDING;
          const accepted = item.status === OutingInviteStatus.ACCEPTED;
          return (
            <li key={item.id}>
              <div
                data-inbox-kind="outing_invite"
                data-outing-invite-id={item.inviteId}
                data-outing-status={item.status}
                className="flex w-full items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] p-3 text-left"
              >
                {person?.photo ? (
                  <img
                    src={person.photo}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {person?.name ?? "Alguém"} convidou você para ir junto
                    {pending ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                    ) : null}
                  </span>
                  <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                    {item.message || `Ir juntos para ${item.targetTitle}.`}
                  </span>
                  {pending ? (
                    <span className="mt-3 flex gap-2">
                      <button
                        type="button"
                        data-outing-accept={item.inviteId}
                        onClick={() =>
                          user?.id && respondToRideFriendInvite(item.inviteId, user.id, true)
                        }
                        className="h-8 rounded-full bg-gradient-brand px-3 text-[11px] font-bold text-white"
                      >
                        Aceitar
                      </button>
                      <button
                        type="button"
                        data-outing-decline={item.inviteId}
                        onClick={() =>
                          user?.id && respondToRideFriendInvite(item.inviteId, user.id, false)
                        }
                        className="h-8 rounded-full border border-border px-3 text-[11px] font-bold"
                      >
                        Recusar
                      </button>
                    </span>
                  ) : (
                    <span className="mt-1 block text-[11px] font-semibold text-primary">
                      {accepted ? "Convite aceito" : "Convite recusado"}
                    </span>
                  )}
                </span>
              </div>
            </li>
          );
        })}

        {visibleItems.length === 0 && (
          <li
            data-inbox-empty={tab === "Todas" || tab === "Social" ? "true" : "filter"}
            className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center"
          >
            <p className="text-xs text-muted-foreground">
              {tab === "Todas" || tab === "Social"
                ? "Nenhuma notificação agora."
                : "Nenhuma notificação neste filtro."}
            </p>
          </li>
        )}
      </ul>
    </div>
  );
}
