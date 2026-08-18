import { useCallback, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Trash2, Loader2, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { ProfileRepository } from "@/repositories/profile.repository";
import { UploadService, BUCKETS } from "@/services/upload.service";
import type { ProfileRow } from "@/types/database/tables";

const AVATAR_MAX_SIZE = 5 * 1024 * 1024;
const AVATAR_DIMENSION = 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function processAvatarImage(file: File): Promise<File> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Escolha uma imagem JPEG, PNG ou WebP.");
  }
  if (file.size > AVATAR_MAX_SIZE) {
    throw new Error("A imagem deve ter no maximo 5 MB.");
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > AVATAR_DIMENSION || height > AVATAR_DIMENSION) {
          const ratio = Math.min(AVATAR_DIMENSION / width, AVATAR_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Nao foi possivel processar esta foto."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
            } else {
              reject(new Error("Nao foi possivel processar esta foto."));
            }
          },
          "image/jpeg",
          0.85,
        );
      } catch {
        reject(new Error("Nao foi possivel processar esta foto."));
      }
    };
    img.onerror = () => reject(new Error("Escolha uma imagem JPEG, PNG ou WebP."));
    img.src = URL.createObjectURL(file);
  });
}

interface Props {
  profile: ProfileRow;
  userId: string;
  configured: boolean;
  onSaved: (updated: ProfileRow) => void;
}

export function BioAvatarSection({ profile, userId, configured, onSaved }: Props) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.photo_url ?? null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const initials = (() => {
    const parts = (profile.name ?? "").trim().split(/\s+/);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  })();

  const handleCameraClick = useCallback(() => cameraInputRef.current?.click(), []);
  const handleGalleryClick = useCallback(() => galleryInputRef.current?.click(), []);

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      event.target.value = "";
      setAvatarError(null);
      try {
        const processed = await processAvatarImage(file);
        if (avatarPreview && avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
        setAvatarFile(processed);
        setAvatarPreview(URL.createObjectURL(processed));
      } catch (err) {
        setAvatarError(err instanceof Error ? err.message : "Erro ao processar imagem.");
      }
    },
    [avatarPreview],
  );

  const handleRemovePreview = useCallback(() => {
    if (avatarPreview && avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(profile.photo_url ?? null);
    setAvatarError(null);
  }, [avatarPreview, profile.photo_url]);

  const handleSavePhoto = async () => {
    if (!configured || saving) return;
    setSaving(true);
    let uploadedPath: string | null = null;
    try {
      if (avatarFile) {
        const { path } = await UploadService.uploadAvatar(userId, avatarFile);
        uploadedPath = path;
        const { data: urlData } = supabase.storage.from(BUCKETS.avatars).getPublicUrl(path);
        const newPhotoUrl = urlData.publicUrl;
        try {
          const updated = await ProfileRepository.updateProfile(userId, {
            photo_url: newPhotoUrl,
          });
          const oldPath = profile.photo_url
            ? UploadService.extractStoragePathFromUrl(profile.photo_url)
            : null;
          if (oldPath) {
            await UploadService.deleteFile(BUCKETS.avatars, [oldPath]).catch(() => {});
          }
          onSaved(updated);
          setAvatarFile(null);
          toast.success("Foto salva!");
        } catch (updateErr) {
          await UploadService.deleteFile(BUCKETS.avatars, [uploadedPath]).catch(() => {});
          throw updateErr;
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar foto.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!configured || saving || removingPhoto) return;
    setRemovingPhoto(true);
    try {
      const updated = await ProfileRepository.updateProfile(userId, { photo_url: null });
      const oldPath = profile.photo_url
        ? UploadService.extractStoragePathFromUrl(profile.photo_url)
        : null;
      if (oldPath) {
        await UploadService.deleteFile(BUCKETS.avatars, [oldPath]).catch(() =>
          toast.warning(
            "Foto removida do perfil, mas o arquivo antigo nao foi excluido do storage.",
          ),
        );
      }
      if (avatarPreview && avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(null);
      setAvatarPreview(null);
      onSaved(updated);
      toast.success("Foto removida!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover foto.");
    } finally {
      setRemovingPhoto(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-24 w-24">
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt="Sua foto de perfil"
            className="h-full w-full rounded-full object-cover ring-2 ring-primary/20"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary ring-2 ring-primary/20">
            {initials ? (
              <span className="text-xl font-bold text-primary/50">{initials}</span>
            ) : (
              <UserRound className="h-8 w-8 text-muted-foreground/50" />
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={handleCameraClick}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium transition-all hover:border-primary/40 hover:bg-accent active:scale-[0.97]"
        >
          <Camera className="h-3.5 w-3.5 text-primary" />
          {avatarPreview ? "Tirar outra" : "Tirar foto"}
        </button>
        <button
          type="button"
          onClick={handleGalleryClick}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium transition-all hover:border-primary/40 hover:bg-accent active:scale-[0.97]"
        >
          <ImageIcon className="h-3.5 w-3.5 text-primary" />
          Galeria
        </button>
        {avatarPreview && (
          <button
            type="button"
            onClick={profile.photo_url ? handleRemovePhoto : handleRemovePreview}
            disabled={removingPhoto}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-surface px-3 py-2 text-xs font-medium text-red-500 transition-all hover:border-red-300 hover:bg-red-50 active:scale-[0.97] disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remover
          </button>
        )}
      </div>
      {avatarError && <p className="text-center text-xs text-red-500">{avatarError}</p>}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />
      {avatarFile && (
        <button
          onClick={handleSavePhoto}
          disabled={saving}
          className="w-full h-11 rounded-xl bg-gradient-brand text-sm font-semibold text-white shadow-soft disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar foto
        </button>
      )}
    </div>
  );
}
