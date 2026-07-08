import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { MapCanvas } from "@/components/map-canvas";
import { PresenceDot } from "@/components/presence-dot";
import { people } from "@/lib/mock-data";
import { proximityLabel, proximityRadius } from "@/lib/proximity";
import {
  ChevronLeft, Phone, Video, MoreVertical,
  Smile, Paperclip, Camera, Send, Mic, MapPin, Image as ImageIcon,
  X, Check, CheckCheck, Play, Trash2, Users2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MeetupSheet, type MeetupPick } from "@/components/chat/meetup-sheet";

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

type Base = { id: string; from: "me" | "them"; at: Date; status?: "sent" | "delivered" | "read" };
type MText = Base & { kind: "text"; text: string };
type MImage = Base & { kind: "image"; url: string; caption?: string };
type MAudio = Base & { kind: "audio"; durationSec: number };
type MLocation = Base & { kind: "location"; label: string; proximity: string };
type Message = MText | MImage | MAudio | MLocation;
type MessageInput =
  | Pick<MText, "from" | "kind" | "text">
  | Pick<MImage, "from" | "kind" | "url" | "caption">
  | Pick<MAudio, "from" | "kind" | "durationSec">
  | Pick<MLocation, "from" | "kind" | "label" | "proximity">;

const cannedReplies = [
  "Adorei a ideia! 😊",
  "Bora sim!",
  "Combinado, te chamo daqui a pouco.",
  "kkkk que massa",
  "Tô aqui pertinho também.",
];

function fmtTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function Chat() {
  const p = Route.useLoaderData();
  const now = new Date();
  const [messages, setMessages] = useState<Message[]>([
    { id: "m1", from: "them", kind: "text", text: `Oi! Vi que também curte ${p.interests[0]?.toLowerCase() ?? "as mesmas coisas"} 🎶`, at: new Date(now.getTime() - 1000 * 60 * 8), status: "read" },
    { id: "m2", from: "me",   kind: "text", text: "Oi! Curto sim. Vai no Sunset hoje?", at: new Date(now.getTime() - 1000 * 60 * 7), status: "read" },
    { id: "m3", from: "them", kind: "text", text: "Estava pensando nisso! Quer marcar por lá?", at: new Date(now.getTime() - 1000 * 60 * 6), status: "read" },
  ]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [meetupOpen, setMeetupOpen] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const push = (m: MessageInput) => {
    const full = { ...m, id: crypto.randomUUID(), at: new Date(), status: "sent" as const } as Message;
    setMessages((prev) => [...prev, full]);
    if (full.from === "me") {
      // mock deliver/read + reply
      setTimeout(() => setMessages((prev) => prev.map((x) => x.id === full.id ? { ...x, status: "delivered" } : x)), 500);
      setTimeout(() => setMessages((prev) => prev.map((x) => x.id === full.id ? { ...x, status: "read" } : x)), 1200);
      setTimeout(() => setTyping(true), 1400);
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), from: "them", kind: "text",
          text: cannedReplies[Math.floor(Math.random() * cannedReplies.length)],
          at: new Date(), status: "read",
        }]);
      }, 2600);
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: "linear-gradient(180deg,#f4efff 0%,#faf7ff 100%)" }}>
      <StatusBar />
      <ChatHeader person={p} />
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        <div className="mx-auto rounded-full bg-white/70 backdrop-blur px-3 py-1 text-[10px] text-muted-foreground w-max shadow-soft">
          Hoje · vocês aceitaram conversar
        </div>
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <Bubble key={m.id} m={m} prevFrom={messages[i - 1]?.from} />
          ))}
        </AnimatePresence>
        {typing && <TypingBubble name={p.name} />}
        <div className="mx-auto mt-3 rounded-xl bg-accent/70 text-[11px] text-primary text-center py-1.5 px-3 w-max shadow-soft">
          Vocês estão {proximityLabel(p.distanceMeters).toLowerCase()} — que tal se encontrar?
        </div>
      </div>
      <Composer onSend={push} personDistance={p.distanceMeters} />
    </div>
  );
}

function ChatHeader({ person }: { person: typeof people[number] }) {
  const p = person;
  return (
    <header className="px-3 pt-1 pb-2 flex items-center gap-2 bg-surface/95 backdrop-blur border-b border-border">
      <Link to="/connecta" className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary">
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <div className="relative">
        <img src={p.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
        <PresenceDot online={p.online} className="absolute -bottom-0.5 -right-0.5" size={11} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm leading-tight">{p.name}</div>
        <div className="text-[11px] text-muted-foreground leading-tight">
          {p.online ? (
            <span className="text-success font-medium">online</span>
          ) : (
            <span>visto {p.lastSeen ?? "há pouco"}</span>
          )}
          <span className="mx-1">·</span>
          <span>{proximityLabel(p.distanceMeters)}</span>
        </div>
      </div>
      <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary text-primary"><Video className="h-4 w-4" /></button>
      <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary text-primary"><Phone className="h-4 w-4" /></button>
      <button className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary"><MoreVertical className="h-4 w-4" /></button>
    </header>
  );
}

function TickIcon({ status }: { status?: Message["status"] }) {
  if (!status) return null;
  if (status === "sent") return <Check className="inline h-3 w-3 opacity-80" />;
  if (status === "delivered") return <CheckCheck className="inline h-3 w-3 opacity-80" />;
  return <CheckCheck className="inline h-3 w-3 text-sky-300" />;
}

function Bubble({ m, prevFrom }: { m: Message; prevFrom?: "me" | "them" }) {
  const mine = m.from === "me";
  const grouped = prevFrom === m.from;
  const base = "max-w-[78%] px-3 py-2 text-sm shadow-soft";
  const tail = mine
    ? `rounded-2xl ${grouped ? "rounded-tr-2xl" : "rounded-tr-md"} rounded-br-sm bg-gradient-brand text-white`
    : `rounded-2xl ${grouped ? "rounded-tl-2xl" : "rounded-tl-md"} rounded-bl-sm bg-surface text-foreground border border-border`;

  const meta = (
    <span className={`ml-2 float-right text-[10px] mt-0.5 inline-flex items-center gap-0.5 ${mine ? "text-white/80" : "text-muted-foreground"}`}>
      {fmtTime(m.at)} {mine && <TickIcon status={m.status} />}
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${mine ? "justify-end" : "justify-start"} ${grouped ? "mt-0.5" : "mt-2"}`}
    >
      <div className={`${base} ${tail}`}>
        {m.kind === "text" && <><span>{m.text}</span>{meta}</>}
        {m.kind === "image" && (
          <div className="-m-1">
            <img src={m.url} alt="" className="rounded-xl max-h-56 w-full object-cover" />
            {m.caption && <div className="px-2 pt-1.5">{m.caption}</div>}
            <div className="px-2 pb-1">{meta}</div>
          </div>
        )}
        {m.kind === "audio" && (
          <div className="flex items-center gap-2 min-w-[180px]">
            <button className={`h-8 w-8 rounded-full grid place-items-center ${mine ? "bg-white/25" : "bg-primary/10 text-primary"}`}>
              <Play className="h-3.5 w-3.5" />
            </button>
            <Waveform mine={mine} />
            <span className={`text-[11px] ${mine ? "text-white/80" : "text-muted-foreground"}`}>
              {String(Math.floor(m.durationSec / 60)).padStart(1, "0")}:{String(m.durationSec % 60).padStart(2, "0")}
            </span>
            {meta}
          </div>
        )}
        {m.kind === "location" && (
          <div className="-m-1 w-56">
            <MapCanvas height={110} pins={[{ x: 50, y: 60, kind: "user", label: "Aqui" }]} />
            <div className={`px-2 py-1.5 text-xs ${mine ? "text-white" : "text-foreground"}`}>
              <div className="font-semibold flex items-center gap-1"><MapPin className="h-3 w-3" /> {m.label}</div>
              <div className={`text-[11px] ${mine ? "text-white/80" : "text-muted-foreground"}`}>{m.proximity}</div>
              <div className="mt-0.5">{meta}</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Waveform({ mine }: { mine: boolean }) {
  const bars = [3, 6, 4, 8, 10, 6, 9, 5, 7, 4, 8, 5, 3];
  return (
    <div className="flex items-center gap-0.5 flex-1">
      {bars.map((h, i) => (
        <span key={i} className={`w-0.5 rounded-full ${mine ? "bg-white/70" : "bg-primary/70"}`} style={{ height: h + 4 }} />
      ))}
    </div>
  );
}

function TypingBubble({ name }: { name: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mt-2">
      <div className="rounded-2xl rounded-bl-sm bg-surface border border-border px-3 py-2 shadow-soft flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">{name} digitando</span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i} className="h-1.5 w-1.5 rounded-full bg-primary/70"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );
}

function Composer({
  onSend, personDistance,
}: {
  onSend: (m: MessageInput) => void;
  personDistance: number;
}) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (recTimer.current) clearInterval(recTimer.current); }, []);

  const sendText = () => {
    const t = text.trim();
    if (!t) return;
    onSend({ from: "me", kind: "text", text: t });
    setText("");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    onSend({ from: "me", kind: "image", url });
    e.target.value = "";
    setShowAttach(false);
  };

  const shareLocation = () => {
    onSend({
      from: "me", kind: "location",
      label: "Minha localização atual",
      proximity: `${proximityLabel(personDistance)} · ${proximityRadius(personDistance)}`,
    });
    setShowAttach(false);
  };

  const startRec = () => {
    setRecording(true); setRecSec(0);
    recTimer.current = setInterval(() => setRecSec((s) => s + 1), 1000);
  };
  const stopRec = (send: boolean) => {
    if (recTimer.current) clearInterval(recTimer.current);
    const dur = recSec;
    setRecording(false); setRecSec(0);
    if (send && dur > 0) onSend({ from: "me", kind: "audio", durationSec: dur });
  };

  const emojis = ["😀","😂","😊","😍","🥰","😎","🤔","😅","🙌","👏","🔥","💜","✨","🎉","☕","🍔","🎶","📍","👋","❤️"];

  return (
    <div className="px-2 pt-2 pb-3 bg-surface/95 backdrop-blur border-t border-border relative">
      <AnimatePresence>
        {showEmoji && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full left-2 right-2 mb-2 rounded-2xl bg-surface border border-border p-2 shadow-elegant grid grid-cols-10 gap-1">
            {emojis.map((e) => (
              <button key={e} onClick={() => { setText((t) => t + e); }} className="text-xl h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary">
                {e}
              </button>
            ))}
          </motion.div>
        )}
        {showAttach && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full left-2 mb-2 rounded-2xl bg-surface border border-border p-2 shadow-elegant grid grid-cols-3 gap-2 w-64">
            <AttachTile icon={ImageIcon} label="Imagem" color="bg-pink/15 text-pink" onClick={() => fileRef.current?.click()} />
            <AttachTile icon={Camera} label="Câmera" color="bg-primary/15 text-primary" onClick={() => camRef.current?.click()} />
            <AttachTile icon={MapPin} label="Localização" color="bg-success/15 text-success" onClick={shareLocation} />
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />

      {recording ? (
        <div className="flex items-center gap-3 h-11 rounded-full bg-secondary px-3">
          <button onClick={() => stopRec(false)} className="h-8 w-8 grid place-items-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
          <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground">
            {String(Math.floor(recSec / 60)).padStart(2, "0")}:{String(recSec % 60).padStart(2, "0")}
          </span>
          <div className="flex-1 flex items-center gap-0.5">
            {Array.from({ length: 22 }).map((_, i) => (
              <motion.span key={i} className="w-0.5 rounded-full bg-primary/60"
                animate={{ height: [4, 4 + Math.random() * 14, 4] }}
                transition={{ duration: 0.6 + (i % 4) * 0.1, repeat: Infinity }}
              />
            ))}
          </div>
          <button onClick={() => stopRec(true)} className="h-10 w-10 grid place-items-center rounded-full bg-gradient-brand text-white shadow-soft">
            <Send className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-center gap-1 bg-secondary rounded-3xl pl-2 pr-1 py-1">
            <button onClick={() => { setShowEmoji((s) => !s); setShowAttach(false); }}
                    className="h-9 w-9 grid place-items-center rounded-full text-muted-foreground hover:text-primary">
              <Smile className="h-5 w-5" />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendText(); }}
              placeholder="Mensagem"
              className="flex-1 bg-transparent outline-none text-sm py-1.5"
            />
            <button onClick={() => { setShowAttach((s) => !s); setShowEmoji(false); }}
                    className="h-9 w-9 grid place-items-center rounded-full text-muted-foreground hover:text-primary">
              {showAttach ? <X className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
            </button>
            <button onClick={() => camRef.current?.click()}
                    className="h-9 w-9 grid place-items-center rounded-full text-muted-foreground hover:text-primary">
              <Camera className="h-5 w-5" />
            </button>
          </div>
          {text.trim() ? (
            <button onClick={sendText} className="h-11 w-11 grid place-items-center rounded-full bg-gradient-brand text-white shadow-soft">
              <Send className="h-5 w-5" />
            </button>
          ) : (
            <button
              onPointerDown={startRec}
              onPointerUp={() => stopRec(true)}
              onPointerLeave={() => recording && stopRec(true)}
              className="h-11 w-11 grid place-items-center rounded-full bg-gradient-brand text-white shadow-soft select-none"
              aria-label="Segurar para gravar áudio"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AttachTile({ icon: Icon, label, color, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 py-2 rounded-xl hover:bg-secondary">
      <span className={`h-11 w-11 grid place-items-center rounded-full ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}
