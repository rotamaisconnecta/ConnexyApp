import { createFileRoute } from "@tanstack/react-router";
import { MessageBubble } from "@/components/chat/message-bubble";
import type { ChatMessage } from "@/lib/chat/chat-types";
import { MessageKind } from "@/lib/chat/chat-types";

export const Route = createFileRoute("/qa-chat-media")({
  component: QaChatMedia,
});

const base = { conversationId: "qa", at: new Date(), status: "read" as const };

const MSGS: ChatMessage[] = [
  {
    ...base,
    id: "t1",
    from: "them",
    kind: MessageKind.TEXT,
    text:
      "E aí tudo certo com o plano para o evento do sábado de manhã na praça? " +
      "Eu quero muito confirmar todos os detalhes da programação completa com você antes.".repeat(
        3,
      ),
  },
  {
    ...base,
    id: "a1",
    from: "them",
    kind: MessageKind.AUDIO,
    durationSec: 42,
    waveform: [1, 2, 4, 3, 5, 4, 3, 2, 1, 2, 3, 4, 6, 5, 4, 3, 2, 1, 2, 3],
  },
  {
    ...base,
    id: "a2",
    from: "me",
    kind: MessageKind.AUDIO,
    durationSec: 6,
    waveform: [3, 2, 1, 3, 4, 3, 2, 1],
  },
  {
    ...base,
    id: "f1",
    from: "them",
    kind: MessageKind.FILE,
    fileName: "proposta-comercial-connexy-2026-final-revisada-comentarios.pdf",
    fileSize: 2.4 * 1024 * 1024,
    mimeType: "application/pdf",
  },
  {
    ...base,
    id: "f2",
    from: "me",
    kind: MessageKind.FILE,
    fileName: "foto_casa_quintal.jpg",
    fileSize: 512 * 1024,
    mimeType: "image/jpeg",
  },
  {
    ...base,
    id: "l1",
    from: "them",
    kind: MessageKind.LOCATION,
    label: "Café do Bairro — Rua das Palmeiras, 123, Centro, São Paulo",
    proximity: "a 400 m",
  },
  {
    ...base,
    id: "l2",
    from: "me",
    kind: MessageKind.LOCATION,
    label: "Praça Central do bairro",
    proximity: "a 1,2 km",
  },
  {
    ...base,
    id: "e1",
    from: "them",
    kind: MessageKind.EVENT,
    title:
      "Festa Junina do Bairro com trilha ao vivo e comidas típicas durante todo o fim de semana",
    dateText: "Sáb, 21:00",
    location: "Praça Central",
  },
  {
    ...base,
    id: "e2",
    from: "me",
    kind: MessageKind.EVENT,
    title: "Festival de Inverno",
    dateText: "Dom, 18:00",
    location: "Parque Municipal",
  },
];

function QaChatMedia() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full flex-col bg-accent/30 px-2 py-4">
      {MSGS.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          participantPhoto="https://i.pravatar.cc/200?img=5"
          grouped={false}
        />
      ))}
    </div>
  );
}