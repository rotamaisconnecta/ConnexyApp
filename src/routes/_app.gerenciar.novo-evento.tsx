import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/gerenciar/novo-evento")({
  head: () => ({ meta: [{ title: "Novo Evento — Connexy" }] }),
  component: RedirectToCreateEvent,
});

function RedirectToCreateEvent() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/create/event" });
  }, [navigate]);
  return null;
}
