import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function usePublisherForm() {
  const nav = useNavigate();
  const [publishing, setPublishing] = useState(false);

  const publish = useCallback(async () => {
    setPublishing(true);
    await new Promise((r) => setTimeout(r, 800));
    setPublishing(false);
    toast.success("Publicado com sucesso!");
    nav({ to: "/home" });
  }, [nav]);

  return { publishing, publish };
}
