import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/gerenciar/novo-texto")({
  head: () => ({ meta: [{ title: "Novo Texto — Connexy" }] }),
  component: RedirectToCreateText,
});

function RedirectToCreateText() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/create/text" });
  }, [navigate]);
  return null;
}
