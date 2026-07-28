import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/gerenciar/nova-oferta")({
  head: () => ({ meta: [{ title: "Nova Oferta — Connexy" }] }),
  component: RedirectToCreateOffer,
});

function RedirectToCreateOffer() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/create/offer" });
  }, [navigate]);
  return null;
}
