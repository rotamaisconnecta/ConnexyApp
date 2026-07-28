import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/gerenciar/novo-video")({
  head: () => ({ meta: [{ title: "Novo Video — Connexy" }] }),
  component: RedirectToCreateVideo,
});

function RedirectToCreateVideo() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/create/video" });
  }, [navigate]);
  return null;
}
