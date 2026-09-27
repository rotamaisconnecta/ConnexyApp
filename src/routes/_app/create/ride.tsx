import { createFileRoute, redirect } from "@tanstack/react-router";
import { CANONICAL_RIDE_CREATE_ROUTE } from "@/lib/create/create-hub-destinations";

export const CREATE_RIDE_REDIRECT_TO = CANONICAL_RIDE_CREATE_ROUTE;

export const Route = createFileRoute("/_app/create/ride")({
  head: () => ({ meta: [{ title: "Solicitar viagem — Connexy" }] }),
  loader: () => {
    throw redirect({ to: CREATE_RIDE_REDIRECT_TO, replace: true });
  },
});
