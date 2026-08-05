import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  CirclePlus,
  Ellipsis,
  Image as ImageIcon,
  MapPin,
  Mic,
  PhoneCall,
  Play,
  Send,
  Sparkles,
  Video,
  Volume2,
  X,
} from "lucide-react";

export type ChatMessage = {
  id: string;
  sender: "me" | "other";
  type: "text" | "audio";
  text?: string;
  duration?: string;
  time: string;
  reaction?: { emoji: string; count: number };
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "other",
    type: "text",
    text: "Oi! Vi que você também vai para o evento no sábado 🎉",
    time: "10:30",
    reaction: { emoji: "❤️", count: 1 },
  },
  {
    id: "2",
    sender: "me",
    type: "text",
    text: "Oi Juliana! Sim, vou sim 😁",
    time: "10:31",
  },
  {
    id: "3",
    sender: "other",
    type: "text",
    text: "Que legal! 🙌\nVai de carro ou transporte?",
    time: "10:32",
  },
  {
    id: "4",
    sender: "me",
    type: "audio",
    duration: "0:12",
    time: "10:32",
  },
  {
    id: "5",
    sender: "me",
    type: "text",
    text: "Ainda não decidi. Talvez peça uma corrida pelo Connexy.",
    time: "10:33",
  },
  {
    id: "6",
    sender: "other",
    type: "text",
    text: "Boa! Se quiser, a gente pode ir junto, moro perto de você.",
    time: "10:34",
    reaction: { emoji: "💜", count: 1 },
  },
  {
    id: "7",
    sender: "me",
    type: "text",
    text: "Top demais! Chama lá no dia 😃",
    time: "10:35",
    reaction: { emoji: "❤️", count: 1 },
  },
];

const QUICK_ACTIONS = [
  {
    id: "local",
    icon: "🏝️",
    title: "Local",
    subtitle: "Compartilhar",
    badge: <MapPin className="h-4 w-4" />,
  },
  {
    id: "event",
    icon: "🗓️",
    title: "Evento",
    subtitle: "Convidar",
    badge: <CalendarDays className="h-4 w-4" />,
  },
  {
    id: "mood",
    icon: "💗",
    title: "Mood",
    subtitle: "Como está se sentindo?",
    badge: null,
  },
  {
    id: "audio",
    icon: "🎙️",
    title: "Áudio rápido",
    subtitle: "Gravar agora",
    badge: <Volume2 className="h-4 w-4" />,
  },
  {
    id: "activity",
    icon: "🎟️",
    title: "Atividade",
    subtitle: "Chamar para sair",
    badge: <ChevronRight className="h-4 w-4" />,
  },
];

function formatProximity(distanceKm: number) {
  if (distanceKm <= 0.5) return "Muito perto";
  if (distanceKm <= 1) return "Na mesma região";
  if (distanceKm <= 2) return "Perto de você";
  return `${distanceKm.toFixed(1).replace(".", ",")} km de distância`;
}

function Avatar({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`relative shrink-0 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-400 to-orange-300 p-[3px] ${
        small ? "h-12 w-12" : "h-[72px] w-[72px]"
      }`}
    >
      <img
        src="/avatars/juliana-santos.jpg"
        alt="Juliana Santos"
        className="h-full w-full rounded-full border-2 border-white object-cover"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.parentElement?.classList.add(
            "before:absolute",
            "before:inset-[5px]",
            "before:grid",
            "before:place-items-center",
            "before:rounded-full",
            "before:bg-[#191724]",
            "before:text-white",
            "before:content-['JS']"
          );
        }}
      />
      {!small && (
        <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-[3px] border-white bg-emerald-500" />
      )}
    </div>
  );
}

function AudioBubble() {
  const bars = useMemo(
    () => [12, 24, 18, 31, 14, 27, 19, 34, 22, 15, 29, 21, 35, 17, 27, 12, 25, 18, 30, 15],
    []
  );

  return (
    <div className="flex min-w-[245px] items-center gap-3">
      <button
        type="button"
        aria-label="Reproduzir áudio"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-500/15 text-violet-600 transition hover:scale-105"
      >
        <Play className="h-5 w-5 fill-current" />
      </button>
      <div className="flex flex-1 items-center gap-[3px]" aria-hidden="true">
        {bars.map((height, index) => (
          <span
            key={index}
            className="w-[3px] rounded-full bg-violet-500/70"
            style={{ height }}
          />
        ))}
      </div>
      <span className="text-sm text-slate-600">0:12</span>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.sender === "me";

  return (
    <div className={`relative flex w-full ${mine ? "justify-end" : "justify-start"}`}>
      {!mine && (
        <div className="mr-3 mt-1">
          <Avatar small />
        </div>
      )}

      <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"}`}>
        <div
          className={`relative rounded-[28px] px-5 py-4 shadow-[0_16px_48px_rgba(88,70,130,0.08)] ${
            mine
              ? "bg-gradient-to-r from-violet-200/85 via-fuchsia-100/90 to-orange-100/95"
              : "border border-white/90 bg-white/95"
          }`}
        >
          {message.type === "audio" ? (
            <AudioBubble />
          ) : (
            <p className="whitespace-pre-line text-[17px] leading-[1.38] text-[#171522]">
              {message.text}
            </p>
          )}

          <div className={`mt-2 flex items-center gap-1 text-xs text-slate-500 ${mine ? "justify-end" : "justify-start"}`}>
            <span>{message.time}</span>
            {mine && <CheckCheck className="h-4 w-4 text-violet-600" />}
          </div>
        </div>

        {message.reaction && (
          <button
            type="button"
            className={`-mt-1 flex h-9 items-center gap-1 rounded-full border border-white bg-white px-3 text-sm shadow-sm ${
              mine ? "ml-auto mr-2" : "ml-4"
            }`}
          >
            <span>{message.reaction.emoji}</span>
            <span className="text-slate-700">{message.reaction.count}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function ConnexyChatScreen() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [showActions, setShowActions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const distanceKm = 2.4;

  function sendMessage() {
    const value = draft.trim();
    if (!value) return;

    const now = new Date();
    const time = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        sender: "me",
        type: "text",
        text: value,
        time,
      },
    ]);
    setDraft("");

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  return (
    <main className="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[#fbfaff] text-[#161421]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.10),transparent_28%),radial-gradient(circle_at_12%_68%,rgba(255,193,7,0.08),transparent_26%)]" />

      <header className="relative z-20 px-5 pb-3 pt-[max(18px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Voltar"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white bg-white/80 shadow-[0_12px_34px_rgba(86,70,120,0.08)]"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          <Avatar />

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-[-0.02em]">Juliana Santos</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Online agora
            </div>
          </div>

          <button
            type="button"
            aria-label="Iniciar vídeo"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white bg-white/80 shadow-[0_12px_34px_rgba(86,70,120,0.08)]"
          >
            <Video className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label="Mais opções"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white bg-white/80 shadow-[0_12px_34px_rgba(86,70,120,0.08)]"
          >
            <Ellipsis className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-white bg-white/80 p-4 shadow-[0_18px_50px_rgba(80,62,120,0.07)]">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-600">
            <MapPin className="h-5 w-5 fill-current" />
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-[15px]">{formatProximity(distanceKm)}</strong>
            <span className="block truncate text-sm text-slate-500">Jardim das Flores, São Paulo</span>
          </div>
          <button
            type="button"
            className="rounded-2xl border border-violet-200 px-4 py-3 text-sm font-semibold text-violet-600"
          >
            Ver no mapa
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="relative z-10 flex-1 space-y-5 overflow-y-auto px-5 pb-7 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex items-center gap-4 py-2 text-xs font-medium text-slate-500">
          <span className="h-px flex-1 bg-slate-200" />
          Hoje
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      <footer className="relative z-30 border-t border-white/70 bg-white/75 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl">
        <div className="flex items-end gap-2">
          <div className="flex min-h-12 flex-1 items-end rounded-[24px] border border-slate-200/80 bg-white px-4 py-2 shadow-sm">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
              placeholder="O que você quer compartilhar?"
              className="max-h-28 min-h-7 flex-1 resize-none bg-transparent py-1 text-[15px] outline-none placeholder:text-slate-400"
            />
            <button type="button" aria-label="Gravar áudio" className="grid h-8 w-8 place-items-center text-violet-600">
              <Mic className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            aria-label="Adicionar imagem"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-600"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={draft.trim() ? sendMessage : () => setShowActions((value) => !value)}
            aria-label={draft.trim() ? "Enviar mensagem" : "Abrir ações inteligentes"}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_12px_30px_rgba(139,92,246,0.30)]"
          >
            {draft.trim() ? <Send className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </button>
        </div>

        {showActions && (
          <div className="relative mt-3">
            <button
              type="button"
              onClick={() => setShowActions(false)}
              className="absolute -top-2 right-0 z-10 grid h-7 w-7 place-items-center rounded-full bg-white shadow"
              aria-label="Fechar ações"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="min-w-[128px] rounded-[24px] border border-white bg-white/90 p-4 text-left shadow-[0_12px_32px_rgba(72,57,100,0.07)]"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{action.icon}</span>
                    {action.badge && (
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-50 text-violet-600">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <strong className="mt-3 block text-sm">{action.title}</strong>
                  <span className="mt-1 block text-xs leading-4 text-slate-500">{action.subtitle}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </footer>
    </main>
  );
}
