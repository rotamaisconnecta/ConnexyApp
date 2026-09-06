import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { StatusBar } from "@/components/phone-frame";
import { CreatePostForm } from "@/components/post/create-post-form";
import { isPostValid, type PostDraft } from "@/lib/types/post";
import { BackButton } from "@/components/navigation/back-button";
import { currentUser } from "@/lib/mock-data";
import { useDemoOwnProfile } from "@/lib/demo/demo-own-profile";
import { saveDemoPost, type DemoPost, type DemoPostMedia } from "@/lib/demo/demo-posts";
import { compressImage, readFileAsDataURL } from "@/lib/upload/upload-utils";

const searchSchema = z.object({
  from: z.enum(["bio"]).optional(),
});

export const Route = createFileRoute("/_app/create-post")({
  head: () => ({ meta: [{ title: "Nova publicação — Connexy" }] }),
  validateSearch: searchSchema,
  component: CreatePostPage,
});

async function buildPersistedMedia(draft: PostDraft): Promise<DemoPostMedia[]> {
  const persisted: DemoPostMedia[] = [];
  for (const media of draft.media) {
    if (media.type === "image") {
      const source = await compressImage(media.file).catch(() => media.file);
      persisted.push({
        preview: String(await readFileAsDataURL(source)),
        type: "image",
      });
    } else {
      persisted.push({
        preview: String(await readFileAsDataURL(media.file)),
        type: "video",
      });
    }
  }
  return persisted;
}

function CreatePostPage() {
  const nav = useNavigate();
  const { from } = Route.useSearch() as { from?: "bio" };
  const demoProfile = useDemoOwnProfile();
  const fromBio = from === "bio";
  const backTo = fromBio ? ("/perfil" as const) : ("/home" as const);

  const handlePublish = async (draft: PostDraft) => {
    if (!isPostValid(draft)) {
      toast.error("Escreva um texto ou adicione mídia e escolha uma categoria.");
      return;
    }

    let media: DemoPostMedia[];
    try {
      media = await buildPersistedMedia(draft);
    } catch {
      toast.error("Não foi possível processar a mídia selecionada. Tente imagens menores.");
      return;
    }

    const post: DemoPost = {
      id: `demo-post-${Date.now()}`,
      authorId: currentUser.id,
      authorName: demoProfile.name,
      authorPhoto: demoProfile.photo,
      authorHandle: demoProfile.handle,
      text: draft.text.trim(),
      media,
      category: draft.category,
      privacy: draft.privacy,
      locationLabel: draft.location?.name.trim() || null,
      hashtags: draft.hashtags,
      createdAt: Date.now(),
    };

    try {
      saveDemoPost(post);
    } catch {
      toast.error(
        "Não foi possível salvar a publicação neste dispositivo. Remova imagens grandes e tente novamente.",
      );
      return;
    }

    toast.success("Publicação criada!");
    nav({ to: backTo });
  };

  return (
    <div className="flex-1 pb-24">
      <StatusBar />

      <header className="px-4 pt-1 pb-3 flex items-center gap-3">
        <BackButton
          fallbackTo={backTo}
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
          ariaLabel="Voltar"
        />
        <h1 className="flex-1 font-display font-bold text-lg">Nova publicação</h1>
        <button
          type="button"
          onClick={() => nav({ to: backTo })}
          className="text-xs font-semibold text-primary"
        >
          Cancelar
        </button>
      </header>

      <div className="px-4">
        <CreatePostForm
          authorName={demoProfile.name}
          authorPhoto={demoProfile.photo}
          authorHandle={demoProfile.handle}
          onPublish={handlePublish}
        />
      </div>
    </div>
  );
}
