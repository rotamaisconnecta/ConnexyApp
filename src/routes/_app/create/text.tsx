import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublisherLayout } from "@/components/publisher/PublisherLayout";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
import { PublisherFooter } from "@/components/publisher/PublisherFooter";
import { PublisherLocationPicker } from "@/components/publisher/PublisherLocationPicker";
import { PublisherVisibility } from "@/components/publisher/PublisherVisibility";
import { PublisherHashtags } from "@/components/publisher/PublisherHashtags";
import { PublisherMentions } from "@/components/publisher/PublisherMentions";
import { PublisherPreview } from "@/components/publisher/PublisherPreview";
import { PublisherCategory } from "@/components/publisher/PublisherCategory";
import { usePublisherForm } from "@/components/publisher/usePublisherForm";

export const Route = createFileRoute("/_app/create/text")({
  head: () => ({ meta: [{ title: "Criar texto" }] }),
  component: TextForm,
});

function TextForm() {
  const { publishing, publish } = usePublisherForm();
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "private" | "followers">("public");

  return (
    <PublisherLayout>
      <PublisherHeader title="Criar texto" />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <PublisherCategory emoji="✍️" label="Texto" />
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Do que você está pensando?"
            rows={6}
            className="w-full px-4 py-3 rounded-xl bg-secondary/50 text-base outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground min-h-[160px]"
          />
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {text.length}/500
          </span>
        </div>
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
