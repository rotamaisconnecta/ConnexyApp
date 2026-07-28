import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/chat/$id")({
  loader: ({ params }) => {
    throw redirect({ to: "/chat/$conversationId", params: { conversationId: params.id } });
  },
});
