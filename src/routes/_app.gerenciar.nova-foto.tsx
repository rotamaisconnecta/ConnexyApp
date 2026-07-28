import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/gerenciar/nova-foto")({
  head: () => ({ meta: [{ title: "Nova Foto — Connexy" }] }),
  component: RedirectToCreatePhoto,
});

function RedirectToCreatePhoto() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/create/photo" });
  }, [navigate]);
  return null;
}
