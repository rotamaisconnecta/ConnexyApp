import { createFileRoute, redirect } from "@tanstack/react-router";
import { CANONICAL_POST_PUBLISH_ROUTE } from "@/lib/create/create-hub-destinations";

export const CREATE_PHOTO_REDIRECT_TO = CANONICAL_POST_PUBLISH_ROUTE;

export const Route = createFileRoute("/_app/create/photo")({
  head: () => ({ meta: [{ title: "Nova publicação — Connexy" }] }),
  loader: () => {
    throw redirect({ to: CREATE_PHOTO_REDIRECT_TO, replace: true });
  },
});
