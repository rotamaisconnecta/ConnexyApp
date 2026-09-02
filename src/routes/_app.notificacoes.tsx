import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { notifications, people } from "@/lib/mock-data";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { isDemoMode } from "@/lib/demo/demo-config";
import { useDemoPendingRequests } from "@/lib/demo/use-demo-db";

const tabs = ["Todas", "Social", "Viagens", "Promoções"] as const;

export const Route = createFileRoute("/_app/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — Connexy" }] }),
  component: Notifs,
});

function iconFor(type: (typeof notifications)[number]["type"]) {
  const map: Record<string, { bg: string; e: string }> = {
    social: { bg: "bg-pink/15 text-pink", e: "👥" },
    event: { bg: "bg-accent text-primary", e: "★" },
    promo: { bg: "bg-primary/15 text-primary", e: "%" },
    chat: { bg: "bg-success/15 text-success", e: "💬" },
  };
  return map[type];
}

function Notifs() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Todas");
  const pendingRequests = useDemoPendingRequests();
  const requestNotifications = isDemoMode()
    ? pendingRequests.map((request) => ({
        request,
        person: people.find((person) => person.id === request.fromUserId),
      }))
    : [];
  const showRequests = tab === "Todas" || tab === "Social";
  const visibleNotifications = notifications.filter((notification) => {
    if (tab === "Todas") return true;
    if (tab === "Social") return notification.type === "social" || notification.type === "chat";
    if (tab === "Promoções") return notification.type === "promo";
    return notification.type === "event";
  });

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
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold ${tab === t ? "bg-gradient-brand text-white" : "bg-secondary text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <ul className="mt-4 px-5 space-y-2 pb-4">
        {showRequests &&
          requestNotifications.map(({ request, person }) => (
            <li key={request.id}>
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/solicitacao/$id",
                    params: { id: request.fromUserId },
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
                    {request.message || "Toque para ver e responder à solicitação."}
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold text-primary">
                    Ver solicitação
                  </span>
                </span>
              </button>
            </li>
          ))}

        {visibleNotifications.map((n) => {
          const ic = iconFor(n.type);
          return (
            <li
              key={n.id}
              className="rounded-2xl bg-surface border border-border p-3 flex items-start gap-3"
            >
              <span
                className={`h-10 w-10 grid place-items-center rounded-full text-sm font-bold ${ic.bg}`}
              >
                {ic.e}
              </span>
              <div className="flex-1">
                <div className="text-sm">{n.text}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{n.time}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
