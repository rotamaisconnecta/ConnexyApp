import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublisherLayout } from "@/components/publisher/PublisherLayout";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
import { PublisherFooter } from "@/components/publisher/PublisherFooter";
import { PublisherGalleryPicker } from "@/components/publisher/PublisherGalleryPicker";
import { PublisherLocationPicker } from "@/components/publisher/PublisherLocationPicker";
import { PublisherVisibility } from "@/components/publisher/PublisherVisibility";
import { PublisherPreview } from "@/components/publisher/PublisherPreview";
import { PublisherCategory } from "@/components/publisher/PublisherCategory";
import { usePublisherForm } from "@/components/publisher/usePublisherForm";

const MOODS = ["😊", "😎", "🤩", "😴", "🥳", "😢", "🤔", "😍", "🔥", "💪"];

export const Route = createFileRoute("/_app/create/moment")({
  head: () => ({ meta: [{ title: "Criar momento" }] }),
  component: MomentForm,
});

function MomentForm() {
  const { publishing, publish } = usePublisherForm();
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [mood, setMood] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "followers">("public");

  return (
    <PublisherLayout>
      <PublisherHeader title="Criar momento" />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <PublisherCategory emoji="⚡" label="Momento" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="O que está acontecendo agora?"
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground"
        />
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Como você está?
          </p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setMood(mood === emoji ? "" : emoji)}
                className={`h-10 w-10 rounded-full grid place-items-center text-xl transition-all ${
                  mood === emoji
                    ? "bg-primary/20 scale-110 ring-2 ring-primary/50"
                    : "bg-secondary/50 hover:bg-secondary"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <PublisherGalleryPicker label="Adicionar foto (opcional)" />
        <PublisherLocationPicker value={location} onChange={setLocation} />
        <PublisherVisibility value={visibility} onChange={setVisibility} />
        <PublisherPreview text={text} location={location} />
      </div>
      <PublisherFooter publishing={publishing} onSubmit={publish} />
    </PublisherLayout>
  );
}
