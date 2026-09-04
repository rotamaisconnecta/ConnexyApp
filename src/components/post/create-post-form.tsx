import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Repeat2, X } from "lucide-react";
import { sectionFade } from "@/components/profile/animations";
import { MediaUploader } from "@/components/post/media-uploader";
import { PostTextEditor } from "@/components/post/post-text-editor";
import { CategorySelector } from "@/components/post/category-selector";
import { InterestSelector } from "@/components/post/interest-selector";
import { LocationSelector } from "@/components/post/location-selector";
import { PrivacySelector } from "@/components/post/privacy-selector";
import { HashtagInput } from "@/components/post/hashtag-input";
import { MentionInput } from "@/components/post/mention-input";
import { PostPreview } from "@/components/post/post-preview";
import { PublishButton } from "@/components/post/publish-button";
import {
  type PostDraft,
  type PostMedia,
  type PostCategoryValue,
  type PostPrivacyValue,
  type PostLocation,
  type PostInterest,
  type PostMention,
  INITIAL_DRAFT,
  PostCategory,
  REPOST_MEDIA_SESSION_KEY,
} from "@/lib/types/post";

const AVAILABLE_INTERESTS = [
  "Viagens",
  "Tecnologia",
  "Networking",
  "Negócios",
  "Arte",
  "Cinema",
  "Games",
  "Esportes",
  "Música",
  "Empreendedorismo",
];

interface CreatePostFormProps {
  authorName: string;
  authorPhoto: string;
  authorHandle: string;
  onPublish: (draft: PostDraft) => void;
}

export function CreatePostForm({
  authorName,
  authorPhoto,
  authorHandle,
  onPublish,
}: CreatePostFormProps) {
  const [draft, setDraft] = useState<PostDraft>(() => ({
    ...INITIAL_DRAFT,
    media: [],
    interests: [],
    hashtags: [],
    mentions: [],
  }));
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    try {
      const repostSource = window.sessionStorage.getItem(REPOST_MEDIA_SESSION_KEY);
      if (!repostSource) return;
      window.sessionStorage.removeItem(REPOST_MEDIA_SESSION_KEY);
      setDraft((previous) => ({
        ...previous,
        repostSource,
        category: PostCategory.PHOTO,
      }));
    } catch {
      // O formulário segue funcionando normalmente sem armazenamento de sessão.
    }
  }, []);

  const update = useCallback(<K extends keyof PostDraft>(key: K, value: PostDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleInterest = useCallback((interest: string) => {
    setDraft((prev) => {
      const exists = prev.interests.some((i) => i.label === interest);
      if (exists) {
        return {
          ...prev,
          interests: prev.interests.filter((i) => i.label !== interest),
        };
      }
      return {
        ...prev,
        interests: [...prev.interests, { id: interest, label: interest }],
      };
    });
  }, []);

  const handlePublish = useCallback(() => {
    setPublishing(true);
    setTimeout(() => {
      onPublish(draft);
      setPublishing(false);
    }, 1000);
  }, [draft, onPublish]);

  return (
    <div className="space-y-5 pb-6">
      <motion.div variants={sectionFade(0)} initial="hidden" animate="visible">
        <SectionTitle>Mídia</SectionTitle>
        {draft.repostSource && (
          <div className="mb-3 overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.04]">
            <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-primary">
              <span className="flex items-center gap-1.5">
                <Repeat2 className="h-3.5 w-3.5" /> Republicação selecionada
              </span>
              <button
                type="button"
                onClick={() => update("repostSource", null)}
                aria-label="Remover republicação"
                className="grid h-7 w-7 place-items-center rounded-full bg-background text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <img
              src={draft.repostSource}
              alt="Imagem que será republicada"
              className="max-h-60 w-full object-cover"
            />
          </div>
        )}
        <MediaUploader media={draft.media} onChange={(m: PostMedia[]) => update("media", m)} />
      </motion.div>

      <motion.div variants={sectionFade(1)} initial="hidden" animate="visible">
        <SectionTitle>Texto</SectionTitle>
        <PostTextEditor value={draft.text} onChange={(v: string) => update("text", v)} />
      </motion.div>

      <motion.div variants={sectionFade(2)} initial="hidden" animate="visible">
        <SectionTitle>Categoria</SectionTitle>
        <CategorySelector
          value={draft.category}
          onChange={(c: PostCategoryValue) => update("category", c)}
        />
      </motion.div>

      <motion.div variants={sectionFade(3)} initial="hidden" animate="visible">
        <SectionTitle>Localização</SectionTitle>
        <LocationSelector
          value={draft.location}
          onChange={(l: PostLocation | null) => update("location", l)}
        />
      </motion.div>

      <motion.div variants={sectionFade(4)} initial="hidden" animate="visible">
        <SectionTitle>Interesses</SectionTitle>
        <InterestSelector
          interests={AVAILABLE_INTERESTS}
          selected={draft.interests.map((i: PostInterest) => i.label)}
          onToggle={toggleInterest}
        />
      </motion.div>

      <motion.div variants={sectionFade(5)} initial="hidden" animate="visible">
        <SectionTitle>Hashtags</SectionTitle>
        <HashtagInput tags={draft.hashtags} onChange={(t: string[]) => update("hashtags", t)} />
      </motion.div>

      <motion.div variants={sectionFade(6)} initial="hidden" animate="visible">
        <SectionTitle>Marcar pessoas</SectionTitle>
        <MentionInput
          mentions={draft.mentions}
          onChange={(m: PostMention[]) => update("mentions", m)}
        />
      </motion.div>

      <motion.div variants={sectionFade(7)} initial="hidden" animate="visible">
        <SectionTitle>Privacidade</SectionTitle>
        <PrivacySelector
          value={draft.privacy}
          onChange={(p: PostPrivacyValue) => update("privacy", p)}
        />
      </motion.div>

      <motion.div variants={sectionFade(8)} initial="hidden" animate="visible">
        <SectionTitle>Pré-visualização</SectionTitle>
        <PostPreview
          draft={draft}
          authorName={authorName}
          authorPhoto={authorPhoto}
          authorHandle={authorHandle}
        />
      </motion.div>

      <motion.div variants={sectionFade(9)} initial="hidden" animate="visible">
        <PublishButton draft={draft} onPublish={handlePublish} publishing={publishing} />
      </motion.div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
      {children}
    </h3>
  );
}
