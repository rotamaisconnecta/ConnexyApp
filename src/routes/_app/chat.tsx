import { createFileRoute } from "@tanstack/react-router";
import { ConversationsScreen } from "@/components/chat/conversations-screen";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Conversas — Connexy" }] }),
  component: ConversationsScreen,
});
