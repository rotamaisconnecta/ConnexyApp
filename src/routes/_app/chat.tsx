import { createFileRoute, Outlet, useMatch } from "@tanstack/react-router";
import { ConversationsScreen } from "@/components/chat/conversations-screen";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Conversas — Connexy" }] }),
  component: ChatRoute,
});

function ChatRoute() {
  const conversationOpen = Boolean(
    useMatch({
      from: "/_app/chat/$conversationId",
      shouldThrow: false,
    }),
  );

  if (conversationOpen) return <Outlet />;

  return <ConversationsScreen />;
}
