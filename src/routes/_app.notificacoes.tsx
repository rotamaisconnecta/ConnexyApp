import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { ChevronLeft } from "lucide-react";
import { notifications } from "@/lib/mock-data";
import { useState } from "react";

const tabs = ["Todas", "Social", "Viagens", "Promoções"] as const;

export const Route = createFileRoute("/_app/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — RotaMais Connecta" }] }),
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
  const [tab, setTab] = useState<(typeof tabs)[number]>("Todas");
  return (
    <div className="flex-1">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <Link to="/home" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
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
        {notifications.map((n) => {
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
