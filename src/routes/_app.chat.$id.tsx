import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { MapCanvas } from "@/components/map-canvas";
import { people } from "@/lib/mock-data";
import { personProximityLabel, personProximityRadius } from "@/lib/proximity";
import {
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  Plus,
  Mic,
  MapPin,
  Camera,
  Check,
  CheckCheck,
  Play,
  Image as ImageIcon,
  User,
  Users2,
  BadgeCheck,
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

type Base = {
  id: string;
  from: "me" | "them";
  at: Date;
  status?: "sent" | "delivered" | "read";
  reaction?: string;
};
type MText = Base & { kind: "text"; text: string };
type MAudio = Base & { kind: "audio"; durationSec: number };
type MLocation = Base & { kind: "location"; label: string; proximity: string; cover?: string };
type MImage = Base & { kind: "image"; url: string };
type Message = MText | MAudio | MLocation | MImage;
type MessageInput =
  | Pick<MText, "from" | "kind" | "text">
  | Pick<MAudio, "from" | "kind" | "durationSec">
  | Pick<MLocation, "from" | "kind" | "label" | "proximity" | "cover">
  | Pick<MImage, "from" | "kind" | "url">;

function fmtTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function Chat() {
  const p = Route.useLoaderData();
  const now = new Date();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      from: "them",
      kind: "text",
      text: `Oi! Vi que você também vai para o evento no sábado 🎉`,
      at: new Date(now.getTime() - 1000 * 60 * 30),
      status: "read",
      reaction: "😍",
    },
    {
      id: "m2",
      from: "me",
      kind: "text",
      text: `Oi ${p.name.split(" ")[0]}! Sim, vou sim 😄`,
      at: new Date(now.getTime() - 1000 * 60 * 29),
      status: "read",
    },
    {
      id: "m3",
      from: "them",
      kind: "text",
      text: `Que legal! 🙌\nVai de carro ou transporte?`,
      at: new Date(now.getTime() - 1000 * 60 * 28),
      status: "read",
    },
    {
      id: "m4",
      from: "me",
      kind: "audio",
      durationSec: 12,
      at: new Date(now.getTime() - 1000 * 60 * 27),
      status: "read",
    },
    {
      id: "m5",
      from: "me",
      kind: "text",
      text: `Ainda não decidi. Talvez peça uma corrida pelo Movea.`,
      at: new Date(now.getTime() - 1000 * 60 * 27),
      status: "read",
    },
    {
      id: "m6",
      from: "them",
      kind: "text",
      text: `Boa! Se quiser, a gente pode ir junto, moro perto de você.`,
      at: new Date(now.getTime() - 1000 * 60 * 26),
      status: "read",
      reaction: "💛",
    },
    {
      id: "m7",
      from: "me",
      kind: "text",
      text: `Top demais! Chama lá no dia 😃`,
      at: new Date(now.getTime() - 1000 * 60 * 25),
      status: "read",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [meetupOpen, setMeetupOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const push = (m: MessageInput) => {
    const full = {
      ...m,
      id: crypto.randomUUID(),
      at: new Date(),
      status: "sent" as const,
    } as Message;
    setMessages((prev) => [...prev, full]);
    if (full.from === "me") {
      setTimeout(
        () =>
          setMessages((prev) =>
            prev.map((x) => (x.id === full.id ? { ...x, status: "delivered" } : x)),
          ),
        500,
      );
      setTimeout(
        () =>
          setMessages((prev) => prev.map((x) => (x.id === full.id ? { ...x, status: "read" } : x))),
        1200,
      );
      setTimeout(() => setTyping(true), 1400);
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            from: "them",
            kind: "text",
            text: "Combinado! 🙌",
            at: new Date(),
            status: "read",
          },
        ]);
      }, 2600);
    }
  };

  const label = personProximityLabel(p.distanceMeters);
  const radius = personProximityRadius(p.distanceMeters);

  return (
    <div className="flex-1 flex flex-col relative bg-gradient-to-b from-[#f5f0ff] via-[#faf7ff] to-[#fdfbff]">
      <StatusBar />
      <ChatHeader person={p} />

      {/* Distance banner */}
      <div className="mx-4 mt-2 rounded-2xl bg-surface border border-border shadow-soft p-3 flex items-center gap-3">
        <div className="h-10 w-10 grid place-items-center rounded-xl bg-accent text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-tight">
            {radius ? `Vocês estão a ${radius} de distância` : "Vocês estão próximos"}
          </div>
          <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>
        </div>
        <button
          onClick={() => setShowMap(true)}
          className="rounded-full border border-primary/30 text-primary text-xs font-semibold px-3 py-1.5"
        >
          Ver no mapa
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        <div className="flex items-center gap-2 my-2">
          <div className="h-px bg-border flex-1" />
          <span className="rounded-full bg-accent/60 text-primary text-[10px] font-bold px-3 py-1 tracking-wider">
            HOJE
          </span>
          <div className="h-px bg-border flex-1" />
        </div>
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <Bubble
              key={m.id}
              m={m}
              prevFrom={messages[i - 1]?.from}
              nextFrom={messages[i + 1]?.from}
              personPhoto={p.photo}
            />
          ))}
        </AnimatePresence>
        {typing && <TypingBubble name={p.name} photo={p.photo} />}
      </div>

      <Composer onSend={push} onOpenMeetup={() => setMeetupOpen(true)} />

      <MeetupSheet
        open={meetupOpen}
        onClose={() => setMeetupOpen(false)}
        personName={p.name}
        onSuggest={(pick: MeetupPick) => {
          push({
            from: "me",
            kind: "location",
            label: pick.placeName,
            proximity: pick.proximity,
            cover: pick.cover,
          });
          setMeetupOpen(false);
        }}
        onShareMyLocation={() => {
          push({
            from: "me",
            kind: "location",
            label: "Minha localização atual",
            proximity: label,
          });
          setMeetupOpen(false);
        }}
      />

      <AnimatePresence>
        {showMap && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMap(false)}
              className="absolute inset-0 bg-foreground/40 z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl bg-surface p-4 pb-6 shadow-elegant"
            >
              <div className="pt-1 pb-2 flex justify-center">
                <span className="h-1.5 w-10 rounded-full bg-border" />
              </div>
              <h3 className="font-display font-bold text-base mb-2">Vocês no mapa</h3>
              <MapCanvas
                height={260}
                pins={[
                  { x: 30, y: 70, kind: "user", label: "Você" },
                  { x: 65, y: 40, kind: "person", label: p.name.split(" ")[0] },
                ]}
              />
              <p className="text-xs text-muted-foreground text-center mt-2">
                {label}
                {radius ? ` · aproximadamente ${radius}` : ""}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatHeader({ person }: { person: (typeof people)[number] }) {
  const p = person;
  return (
    <header className="px-3 pt-1 pb-2 flex items-center gap-2">
      <Link
        to="/connecta"
        className="h-11 w-11 grid place-items-center rounded-2xl bg-surface shadow-soft border border-border"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <Link
        to="/perfil/$id"
        params={{ id: p.id }}
        search={{ from: "chat" }}
        className="flex items-center gap-2.5 flex-1 min-w-0"
      >
        <div className="relative">
          <img
            src={p.photo}
            alt=""
            className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/30"
          />
          {p.online && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-surface" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-base leading-tight flex items-center gap-1">
            {p.name} <BadgeCheck className="h-4 w-4 text-primary fill-primary text-white" />
          </div>
          <div className="text-[11px] leading-tight flex items-center gap-1">
            {p.online ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                <span className="text-success font-medium">Online agora</span>
              </>
            ) : (
              <span className="text-muted-foreground">visto {p.lastSeen ?? "há pouco"}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-1.5">
        <button className="h-10 w-10 grid place-items-center rounded-xl bg-surface shadow-soft border border-border text-primary">
          <Phone className="h-4 w-4" />
        </button>
        <button className="h-10 w-10 grid place-items-center rounded-xl bg-surface shadow-soft border border-border text-primary">
          <Video className="h-4 w-4" />
        </button>
        <button className="h-10 w-10 grid place-items-center rounded-xl bg-surface shadow-soft border border-border">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function TickIcon({ status }: { status?: Message["status"] }) {
  if (!status) return null;
  if (status === "sent") return <Check className="inline h-3 w-3 opacity-80" />;
  if (status === "delivered") return <CheckCheck className="inline h-3 w-3 opacity-80" />;
  return <CheckCheck className="inline h-3 w-3" />;
}

function Bubble({
  m,
  prevFrom,
  nextFrom,
  personPhoto,
}: {
  m: Message;
  prevFrom?: "me" | "them";
  nextFrom?: "me" | "them";
  personPhoto: string;
}) {
  const mine = m.from === "me";
  const groupedTop = prevFrom === m.from;
  const groupedBottom = nextFrom === m.from;
  const showAvatar = !mine && !groupedBottom;

  const bubbleClass = mine
    ? `bg-gradient-brand text-white ${groupedBottom ? "rounded-3xl" : "rounded-3xl rounded-br-md"} shadow-soft`
    : `bg-surface text-foreground border border-border ${groupedBottom ? "rounded-3xl" : "rounded-3xl rounded-bl-md"} shadow-soft`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${mine ? "justify-end" : "justify-start"} ${groupedTop ? "mt-0.5" : "mt-2.5"} gap-2`}
    >
      {!mine && (
        <div className="w-8 shrink-0 self-end">
          {showAvatar && (
            <img
              src={personPhoto}
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
            />
          )}
        </div>
      )}
      <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`${bubbleClass} px-4 py-2.5`}>
          {m.kind === "text" && (
            <p className="text-[15px] leading-snug whitespace-pre-line">{m.text}</p>
          )}
          {m.kind === "image" && (
            <img src={m.url} alt="" className="rounded-2xl max-h-56 w-full object-cover -mx-1" />
          )}
          {m.kind === "audio" && (
            <div className="flex items-center gap-2 min-w-[200px] py-0.5">
              <button
                className={`h-8 w-8 rounded-full grid place-items-center ${mine ? "bg-white/25" : "bg-primary/10 text-primary"}`}
              >
                <Play className="h-3.5 w-3.5" />
              </button>
              <Waveform mine={mine} />
              <span className={`text-[11px] ${mine ? "text-white/85" : "text-muted-foreground"}`}>
                0:{String(m.durationSec).padStart(2, "0")}
              </span>
            </div>
          )}
          {m.kind === "location" && (
            <div className="-mx-2 -my-1 w-64">
              {m.cover ? (
                <img src={m.cover} alt="" className="rounded-t-2xl h-24 w-full object-cover" />
              ) : (
                <MapCanvas height={100} pins={[{ x: 50, y: 55, kind: "place", label: m.label }]} />
              )}
              <div className={`px-3 py-2 ${mine ? "text-white" : "text-foreground"}`}>
                <div className="font-semibold text-sm flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {m.label}
                </div>
                <div
                  className={`text-[11px] mt-0.5 ${mine ? "text-white/85" : "text-muted-foreground"}`}
                >
                  {m.proximity}
                </div>
              </div>
            </div>
          )}
          <div
            className={`text-[10px] mt-1 flex items-center gap-1 ${mine ? "justify-end text-white/80" : "justify-start text-muted-foreground"}`}
          >
            {fmtTime(m.at)} {mine && <TickIcon status={m.status} />}
          </div>
        </div>
        {m.reaction && (
          <div
            className={`-mt-2 ${mine ? "self-end mr-3" : "self-start ml-3"} rounded-full bg-surface border border-border shadow-soft px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1`}
          >
            <span>{m.reaction}</span>
            <span className="text-muted-foreground">1</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Waveform({ mine }: { mine: boolean }) {
  const bars = [3, 6, 4, 8, 10, 6, 9, 5, 7, 4, 8, 5, 3, 7, 9, 5];
  return (
    <div className="flex items-center gap-0.5 flex-1">
      {bars.map((h, i) => (
        <span
          key={i}
          className={`w-0.5 rounded-full ${mine ? "bg-white/70" : "bg-primary/70"}`}
          style={{ height: h + 4 }}
        />
      ))}
    </div>
  );
}

function TypingBubble({ name, photo }: { name: string; photo: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start mt-2 gap-2"
    >
      <img
        src={photo}
        alt=""
        className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20 self-end"
      />
      <div className="rounded-3xl rounded-bl-md bg-surface border border-border px-4 py-3 shadow-soft flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">{name.split(" ")[0]} digitando</span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary/70"
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
  onSend,
  onOpenMeetup,
}: {
  onSend: (m: MessageInput) => void;
  onOpenMeetup: () => void;
}) {
  const [text, setText] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onSend({ from: "me", kind: "text", text: t });
    setText("");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onSend({ from: "me", kind: "image", url: URL.createObjectURL(f) });
    e.target.value = "";
    setShowAttach(false);
  };

  return (
    <div className="px-3 pt-2 pb-3">
      {/* Composer input */}
      <div className="rounded-full bg-surface border border-border shadow-soft flex items-center gap-2 pl-1 pr-2 py-1">
        <button
          onClick={() => setShowAttach((s) => !s)}
          className="h-10 w-10 grid place-items-center rounded-full bg-primary/10 text-primary"
          aria-label="Anexar"
        >
          <Plus className="h-5 w-5" />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Digite uma mensagem..."
          className="flex-1 bg-transparent outline-none text-sm py-2 placeholder:text-muted-foreground"
        />
        <button
          onClick={send}
          className="h-9 w-9 grid place-items-center rounded-full bg-primary/15 text-primary"
          aria-label={text.trim() ? "Enviar" : "Gravar áudio"}
        >
          <Mic className="h-4 w-4" />
        </button>
      </div>

      {/* Attach tiles */}
      <AnimatePresence>
        {showAttach && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-3 grid grid-cols-6 gap-2"
          >
            <AttachTile icon={ImageIcon} label="Galeria" onClick={() => fileRef.current?.click()} />
            <AttachTile icon={Camera} label="Câmera" onClick={() => camRef.current?.click()} />
            <AttachTile
              icon={Mic}
              label="Áudio"
              onClick={() => {
                onSend({ from: "me", kind: "audio", durationSec: 8 });
                setShowAttach(false);
              }}
            />
            <AttachTile
              icon={MapPin}
              label="Local"
              primary
              onClick={() => {
                setShowAttach(false);
                onOpenMeetup();
              }}
            />
            <AttachTile icon={User} label="Contato" onClick={() => setShowAttach(false)} />
            <AttachTile
              icon={Users2}
              label="Encontro"
              onClick={() => {
                setShowAttach(false);
                onOpenMeetup();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleFile}
      />
    </div>
  );
}

function AttachTile({
  icon: Icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5">
      <span
        className={`h-12 w-12 grid place-items-center rounded-2xl border shadow-soft ${primary ? "bg-gradient-brand text-white border-transparent" : "bg-surface text-primary border-border"}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
    </button>
  );
}
