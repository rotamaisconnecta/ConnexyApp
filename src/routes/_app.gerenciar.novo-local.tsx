import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/gerenciar/novo-local")({
  head: () => ({ meta: [{ title: "Novo Local — Connexy" }] }),
  component: RedirectToCreatePlace,
});

function RedirectToCreatePlace() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/create/place" });
  }, [navigate]);
  return null;
}
