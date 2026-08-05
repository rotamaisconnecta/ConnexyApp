import { createFileRoute } from "@tanstack/react-router";
import ConnexyChatScreen from "@/components/chat/ConnexyChatScreen";

export const Route = createFileRoute("/_app/chat/$conversationId")({
  head: () => ({ meta: [{ title: "Chat — Connexy" }] }),
  component: ConversationRoute,
});

function ConversationRoute() {
  const { conversationId } = Route.useParams();

  return <ConnexyChatScreen conversationId={conversationId} />;
}
