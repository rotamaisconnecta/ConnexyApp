import { createFileRoute, redirect } from "@tanstack/react-router";
import { CANONICAL_REEL_PUBLISH_ROUTE } from "@/lib/reels/canonical-reel-publish-route";

export const CREATE_REEL_REDIRECT_TO = CANONICAL_REEL_PUBLISH_ROUTE;

export const Route = createFileRoute("/_app/create/reel")({
  head: () => ({ meta: [{ title: "Novo no Agora — Connexy" }] }),
  loader: () => {
    throw redirect({ to: CREATE_REEL_REDIRECT_TO, replace: true });
  },
});
