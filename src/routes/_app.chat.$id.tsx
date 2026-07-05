import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { people } from "@/lib/mock-data";
import { ChevronLeft, MapPin, Send, Smile } from "lucide-react";

export const Route = createFileRoute("/_app/chat/$id")({
  head: () => ({ meta: [{ title: "Chat — Connecta" }] }),
  loader: ({ params }) => {
    const person = people.find((p) => p.id === params.id);
    if (!person) throw notFound();
    return person;
  },
  errorComponent: ({ error }) => <div className="p-6 text-sm">{error.message}</div>,
  notFoundComponent: () => <div className="p-6 text-sm">Conversa não encontrada.</div>,
  component: Chat,
});

const msgs = [
  { from: "them", text: "Oi! Vi que também curte música indie 🎶" },
  { from: "me", text: "Oi! Curto sim. Vai no Sunset hoje?" },
  { from: "them", text: "Estava pensando nisso!" },
  { from: "me", text: "Quer se encontrar por lá?" },
];

function Chat() {
  const p = Route.useLoaderData();
  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />
      <header className="px-4 pt-1 pb-3 flex items-center gap-3 border-b border-border">
        <Link to="/connecta" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <img src={p.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{p.name}</div>
          <div className="text-[11px] text-success flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> online · {p.distance}
          </div>
        </div>
        <button className="rounded-full bg-gradient-brand text-white text-[11px] font-semibold px-3 py-1.5 flex items-center gap-1">
          <MapPin className="h-3 w-3" /> Encontrar
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <div className="text-center text-[10px] text-muted-foreground">Hoje</div>
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.from === "me"
              ? "bg-gradient-brand text-white rounded-br-sm"
              : "bg-secondary text-foreground rounded-bl-sm"}`}>
              {m.text}
            </div>
          </div>
        ))}
        <div className="rounded-xl bg-accent/50 text-[11px] text-primary text-center py-1.5">
          Vocês estão a apenas {p.distance} · que tal se encontrar?
        </div>
      </div>

      <div className="px-4 pt-2 pb-3 border-t border-border flex items-center gap-2">
        <button className="h-10 w-10 grid place-items-center rounded-full bg-secondary">
          <Smile className="h-4 w-4" />
        </button>
        <input placeholder="Escreva uma mensagem" className="flex-1 h-10 rounded-full bg-secondary px-4 text-sm outline-none" />
        <button className="h-10 w-10 grid place-items-center rounded-full bg-gradient-brand text-white shadow-soft">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
