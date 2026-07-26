import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublisherLayout } from "@/components/publisher/PublisherLayout";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
import { PublisherFooter } from "@/components/publisher/PublisherFooter";
import { PublisherGalleryPicker } from "@/components/publisher/PublisherGalleryPicker";
import { PublisherLocationPicker } from "@/components/publisher/PublisherLocationPicker";
import { PublisherVisibility } from "@/components/publisher/PublisherVisibility";
import { PublisherHashtags } from "@/components/publisher/PublisherHashtags";
import { PublisherMentions } from "@/components/publisher/PublisherMentions";
import { PublisherPreview } from "@/components/publisher/PublisherPreview";
import { PublisherCategory } from "@/components/publisher/PublisherCategory";
import { usePublisherForm } from "@/components/publisher/usePublisherForm";
import { Music } from "lucide-react";

export const Route = createFileRoute("/_app/create/reel")({
  head: () => ({ meta: [{ title: "Criar reel" }] }),
  component: ReelForm,
});

function ReelForm() {
  const { publishing, publish } = usePublisherForm();
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "private" | "followers">("public");
  const [music, setMusic] = useState("");

  return (
    <PublisherLayout>
      <PublisherHeader title="Criar reel" />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <PublisherCategory emoji="▶️" label="Reel" />
        <PublisherGalleryPicker type="video" label="Gravar ou enviar reel" />
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            <Music className="h-3.5 w-3.5" />
            Música
          </div>
          <input
            type="text"
            value={music}
            onChange={(e) => setMusic(e.target.value)}
            placeholder="Buscar música..."
            className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva uma legenda..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground"
        />
        <PublisherLocationPicker value={location} onChange={setLocation} />
        <PublisherHashtags tags={tags} onChange={setTags} />
        <PublisherMentions mentions={mentions} onChange={setMentions} />
        <PublisherVisibility value={visibility} onChange={setVisibility} />
        <PublisherPreview text={text} location={location} hashtags={tags} />
      </div>
      <PublisherFooter publishing={publishing} onSubmit={publish} />
    </PublisherLayout>
  );
}
