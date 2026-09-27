import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notificações — Connexy" }] }),
  loader: () => {
    throw redirect({ to: "/notificacoes", replace: true });
  },
});
