import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { CreatePostForm } from "@/components/post/create-post-form";
import { currentUser } from "@/lib/mock-data";
import { type PostDraft } from "@/lib/types/post";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_app/create-post")({
  head: () => ({ meta: [{ title: "Nova publicação — Connexy" }] }),
  component: CreatePostPage,
});

function CreatePostPage() {
  const nav = useNavigate();

  const handlePublish = (_draft: PostDraft) => {
    nav({ to: "/home" });
  };

  return (
    <div className="flex-1 pb-24">
      <StatusBar />

      <header className="px-4 pt-1 pb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => nav({ to: "/home" })}
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="flex-1 font-display font-bold text-lg">Nova publicação</h1>
        <button
          type="button"
          onClick={() => nav({ to: "/home" })}
          className="text-xs font-semibold text-primary"
        >
          Cancelar
        </button>
      </header>

      <div className="px-4">
        <CreatePostForm
          authorName={currentUser.name}
          authorPhoto={currentUser.photo}
          authorHandle={currentUser.handle}
          onPublish={handlePublish}
        />
      </div>
    </div>
  );
}
