import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublisherLayout } from "@/components/publisher/PublisherLayout";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
import { PublisherFooter } from "@/components/publisher/PublisherFooter";
import { UploadMedia } from "@/components/ui/UploadMedia";
import { PublisherLocationPicker } from "@/components/publisher/PublisherLocationPicker";
import { PublisherVisibility } from "@/components/publisher/PublisherVisibility";
import { PublisherHashtags } from "@/components/publisher/PublisherHashtags";
import { PublisherPreview } from "@/components/publisher/PublisherPreview";
import { PublisherCategory } from "@/components/publisher/PublisherCategory";
import { usePublisherForm } from "@/components/publisher/usePublisherForm";

export const Route = createFileRoute("/_app/create/video")({
  head: () => ({ meta: [{ title: "Criar vídeo" }] }),
  component: VideoForm,
});

function VideoForm() {
  const { publishing, publish } = usePublisherForm();
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "private" | "followers">("public");

  return (
    <PublisherLayout>
      <PublisherHeader title="Criar vídeo" />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <PublisherCategory emoji="🎥" label="Vídeo" />
        <UploadMedia accept="video/*" label="Adicionar vídeo" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva uma legenda..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground"
        />
        <PublisherLocationPicker value={location} onChange={setLocation} />
        <PublisherHashtags tags={tags} onChange={setTags} />
        <PublisherVisibility value={visibility} onChange={setVisibility} />
        <PublisherPreview text={text} location={location} hashtags={tags} />
      </div>
      <PublisherFooter publishing={publishing} onSubmit={publish} />
    </PublisherLayout>
  );
}
