import { useRef, useState } from "react";
import { Plus, Trash2, Loader2, Image as ImageIcon, X, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { FeedRepository } from "@/repositories/feed.repository";
import { UploadService, BUCKETS } from "@/services/upload.service";
import { supabase } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/system/confirm-dialog";
import type { BioPostRow } from "@/types/database/tables";

interface Props {
  posts: BioPostRow[];
  userId: string;
  configured: boolean;
  onPostsChanged: (posts: BioPostRow[]) => void;
}

export function BioPostsSection({ posts, userId, configured, onPostsChanged }: Props) {
  const [newPostText, setNewPostText] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingMediaFor, setUploadingMediaFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingMediaFile, setPendingMediaFile] = useState<File | null>(null);
  const [pendingMediaPreview, setPendingMediaPreview] = useState<string | null>(null);

  const handleCreatePost = async () => {
    if (!configured || creatingPost) return;
    const text = newPostText.trim();
    if (!text && !pendingMediaFile) return;
    setCreatingPost(true);
    let uploadedPath: string | null = null;
    try {
      let mediaUrl: string | null = null;
      let mediaKind: string | null = null;
      if (pendingMediaFile) {
        const { path } = await UploadService.uploadPostMedia(
          userId,
          pendingMediaFile,
          BUCKETS.bioMedia,
        );
        uploadedPath = path;
        const { data: urlData } = supabase.storage.from(BUCKETS.bioMedia).getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
        mediaKind = "image";
      }
      const post = await FeedRepository.create({
        author_id: userId,
        text: text || " ",
        media_url: mediaUrl,
        media_kind: mediaKind,
      });
      onPostsChanged([post, ...posts]);
      setNewPostText("");
      setPendingMediaFile(null);
      setPendingMediaPreview(null);
      toast.success("Publicacao criada!");
    } catch (err) {
      if (uploadedPath) {
        await UploadService.deleteFile(BUCKETS.bioMedia, [uploadedPath]).catch(() => {});
      }
      toast.error(err instanceof Error ? err.message : "Erro ao criar publicacao.");
    } finally {
      setCreatingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId);
      await FeedRepository.delete(postId, userId);
      if (post?.media_url) {
        const path = UploadService.extractStoragePathFromUrl(post.media_url);
        if (path) {
          await UploadService.deleteFile(BUCKETS.bioMedia, [path]).catch(() =>
            toast.warning("Post excluido, mas a mídia nao foi removida do storage."),
          );
        }
      }
      onPostsChanged(posts.filter((p) => p.id !== postId));
      toast.success("Publicacao excluida!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir publicacao.");
    }
  };

  const startEdit = (post: BioPostRow) => {
    setEditingId(post.id);
    setEditText(post.text === " " ? "" : post.text);
  };

  const handleSaveEdit = async () => {
    if (!editingId || savingEdit) return;
    setSavingEdit(true);
    try {
      const updated = await FeedRepository.update(editingId, userId, {
        text: editText.trim() || " ",
      });
      onPostsChanged(posts.map((p) => (p.id === editingId ? updated : p)));
      setEditingId(null);
      toast.success("Publicacao atualizada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao editar.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleMediaFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
    targetPostId?: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Arquivo deve ter no maximo 10MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens sao permitidas.");
      return;
    }
    if (targetPostId) {
      setUploadingMediaFor(targetPostId);
      let uploadedPath: string | null = null;
      try {
        const { path } = await UploadService.uploadPostMedia(userId, file, BUCKETS.bioMedia);
        uploadedPath = path;
        const { data: urlData } = supabase.storage.from(BUCKETS.bioMedia).getPublicUrl(path);
        const mediaUrl = urlData.publicUrl;
        const mediaKind = "image";
        const oldPost = posts.find((p) => p.id === targetPostId);
        const updated = await FeedRepository.update(targetPostId, userId, {
          media_url: mediaUrl,
          media_kind: mediaKind,
        });
        if (oldPost?.media_url) {
          const oldPath = UploadService.extractStoragePathFromUrl(oldPost.media_url);
          if (oldPath) {
            await UploadService.deleteFile(BUCKETS.bioMedia, [oldPath]).catch(() =>
              toast.warning("Midia antiga nao foi removida do storage."),
            );
          }
        }
        onPostsChanged(posts.map((p) => (p.id === targetPostId ? updated : p)));
        toast.success("Midia atualizada!");
      } catch (err) {
        if (uploadedPath) {
          await UploadService.deleteFile(BUCKETS.bioMedia, [uploadedPath]).catch(() => {});
        }
        toast.error(err instanceof Error ? err.message : "Erro ao enviar midia.");
      } finally {
        setUploadingMediaFor(null);
      }
    } else {
      setPendingMediaFile(file);
      setPendingMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveMedia = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    try {
      const updated = await FeedRepository.update(postId, userId, {
        media_url: null,
        media_kind: null,
      });
      if (post.media_url) {
        const path = UploadService.extractStoragePathFromUrl(post.media_url);
        if (path) {
          await UploadService.deleteFile(BUCKETS.bioMedia, [path]).catch(() =>
            toast.warning("Midia nao foi removida do storage."),
          );
        }
      }
      onPostsChanged(posts.map((p) => (p.id === postId ? updated : p)));
      toast.success("Midia removida!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover midia.");
    }
  };

  const removePendingMedia = () => {
    if (pendingMediaPreview && pendingMediaPreview.startsWith("blob:")) {
      URL.revokeObjectURL(pendingMediaPreview);
    }
    setPendingMediaFile(null);
    setPendingMediaPreview(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleCreatePost();
            }
          }}
          placeholder="No que voce esta pensando?"
          className="flex-1 h-11 rounded-xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="h-11 w-11 rounded-xl bg-accent text-primary flex items-center justify-center shrink-0"
          aria-label="Anexar midia"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <button
          onClick={handleCreatePost}
          disabled={(!newPostText.trim() && !pendingMediaFile) || creatingPost}
          className="h-11 w-11 rounded-xl bg-gradient-brand text-white flex items-center justify-center disabled:opacity-50 shrink-0"
        >
          {creatingPost ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleMediaFileSelected(e)}
      />
      {pendingMediaPreview && (
        <div className="relative inline-block">
          <img
            src={pendingMediaPreview}
            alt="Midia a enviar"
            className="h-20 w-20 rounded-xl object-cover"
          />
          <button
            onClick={removePendingMedia}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white grid place-items-center"
            aria-label="Remover midia"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      {posts.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-4">Nenhuma publicacao ainda.</p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post.id} className="rounded-xl bg-secondary p-3 space-y-2">
              {editingId === post.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                    }}
                    className="flex-1 h-9 rounded-lg bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center"
                    aria-label="Salvar"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="h-9 w-9 rounded-lg bg-secondary text-muted-foreground grid place-items-center"
                    aria-label="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  {post.text && post.text !== " " && (
                    <p className="text-sm text-foreground leading-relaxed">{post.text}</p>
                  )}
                  {post.media_url && (
                    <div className="relative">
                      <img
                        src={post.media_url}
                        alt="Midia da publicacao"
                        className="w-full max-h-48 rounded-lg object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-1 justify-end">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      id={`media-input-${post.id}`}
                      onChange={(e) => handleMediaFileSelected(e, post.id)}
                    />
                    <button
                      onClick={() => document.getElementById(`media-input-${post.id}`)?.click()}
                      disabled={uploadingMediaFor === post.id}
                      className="h-7 w-7 grid place-items-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label={post.media_url ? "Trocar midia" : "Adicionar midia"}
                    >
                      {uploadingMediaFor === post.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {post.media_url && (
                      <button
                        onClick={() => handleRemoveMedia(post.id)}
                        className="h-7 w-7 grid place-items-center rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        aria-label="Remover midia"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(post)}
                      className="h-7 w-7 grid place-items-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="Editar texto"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(post.id)}
                      className="h-7 w-7 grid place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Excluir publicacao"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDeletePost(deleteTarget);
          setDeleteTarget(null);
        }}
        title="Excluir publicacao"
        message="Tem certeza que deseja excluir esta publicacao? Esta acao nao pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        danger
      />
    </div>
  );
}
