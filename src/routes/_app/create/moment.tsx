import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  CANONICAL_MOMENT_CATEGORY,
  CANONICAL_POST_PUBLISH_ROUTE,
} from "@/lib/create/create-hub-destinations";

export const CREATE_MOMENT_REDIRECT_TO = CANONICAL_POST_PUBLISH_ROUTE;

export const Route = createFileRoute("/_app/create/moment")({
  head: () => ({ meta: [{ title: "Nova publicação — Connexy" }] }),
  loader: () => {
    throw redirect({
      to: CREATE_MOMENT_REDIRECT_TO,
      search: { category: CANONICAL_MOMENT_CATEGORY },
      replace: true,
    });
  },
});
