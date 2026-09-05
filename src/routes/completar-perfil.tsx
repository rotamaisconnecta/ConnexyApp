import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AtSign,
  CalendarDays,
  Camera,
  ChevronDown,
  Image as ImageIcon,
  Trash2,
  UserRound,
} from "lucide-react";
import { PhoneFrame, StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { useAuth } from "@/hooks/use-auth";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { profileOnboardingForGuard } from "@/lib/profile/profile-status";
import { ProfileRepository } from "@/repositories/profile.repository";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/completar-perfil")({
  beforeLoad: async () => {
    const decision = await profileOnboardingForGuard();
    if (!decision.allowed) throw redirect({ to: decision.to, replace: true });
  },
  head: () => ({ meta: [{ title: "Complete seu perfil | Connexy" }] }),
  component: CompleteProfile,
});

const AVATAR_MAX_SIZE = 5 * 1024 * 1024;
const AVATAR_DIMENSION = 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function ageFromBirthDate(value: string): number | null {
  if (!value) return null;
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

async function processAvatarImage(file: File): Promise<File> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Escolha uma imagem JPEG, PNG ou WebP.");
  }
  if (file.size > AVATAR_MAX_SIZE) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
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
          reject(new Error("Não foi possível processar esta foto. Tente novamente."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
            } else {
              reject(new Error("Não foi possível processar esta foto. Tente novamente."));
            }
          },
          "image/jpeg",
          0.85,
        );
      } catch {
        reject(new Error("Não foi possível processar esta foto. Tente novamente."));
      }
    };
    img.onerror = () => {
      reject(new Error("Escolha uma imagem JPEG, PNG ou WebP."));
    };
    img.src = URL.createObjectURL(file);
  });
}

function CompleteProfile() {
  const nav = useNavigate();
  const { user } = useAuth();
  const configured = isPublicSupabaseConfigured();

  // SSR cannot read demo browser state, so the guard re-evaluates client-side
  // after hydration to enforce the pending-signup rule on full page loads.
  useEffect(() => {
    let cancelled = false;
    void profileOnboardingForGuard().then((decision) => {
      if (cancelled || decision.allowed) return;
      nav({ to: decision.to, replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [nav]);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const canContinue = Boolean(name.trim() && username.trim() && birthDate);
  const maxBirthDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const initials = useMemo(() => getInitials(name), [name]);

  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const handleGalleryClick = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      event.target.value = "";
      setAvatarError(null);
      try {
        const processed = await processAvatarImage(file);
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarFile(processed);
        setAvatarPreview(URL.createObjectURL(processed));
      } catch (err) {
        setAvatarError(err instanceof Error ? err.message : "Erro ao processar imagem.");
      }
    },
    [avatarPreview],
  );

  const handleRemoveAvatar = useCallback(() => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError(null);
  }, [avatarPreview]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canContinue || saving) return;

    let uploadedPath: string | null = null;

    try {
      if (configured && user) {
        setSaving(true);

        let photoUrl: string | null = null;

        if (avatarFile) {
          const ext = "jpg";
          const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, avatarFile, { contentType: "image/jpeg", upsert: true });
          if (uploadError) {
            throw new Error(
              uploadError.message
                ? `Falha ao enviar a foto: ${uploadError.message}`
                : "Falha ao enviar a foto. Tente novamente.",
            );
          }
          uploadedPath = path;
          const { data: signed, error: signedError } = await supabase.storage
            .from("avatars")
            .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
          if (signedError || !signed?.signedUrl) {
            throw new Error("Falha ao processar a foto. Tente novamente.");
          }
          photoUrl = signed.signedUrl;
        }


        try {
          await ProfileRepository.updateProfile(user.id, {
            name: name.trim(),
            handle: username.trim().toLowerCase(),
            bio: bio.trim() || null,
            age: ageFromBirthDate(birthDate),
            ...(avatarFile ? { photo_url: photoUrl } : {}),
          });
        } catch {
          if (uploadedPath) {
            await supabase.storage.from("avatars").remove([uploadedPath]);
          }
          throw new Error("Não foi possível salvar seu perfil. Tente novamente.");
        }
      }
      nav({ to: "/interesses" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado.");
      setSaving(false);
    }
  }

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto no-scrollbar bg-white text-foreground">
        <StatusBar />
        <div className="px-6 pb-8 pt-4">
          <div className="flex items-center justify-between">
            <BackButton
              fallbackTo="/cadastro"
              ariaLabel="Voltar"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-100 bg-white text-foreground shadow-soft"
            >
              <span className="text-4xl font-light leading-none">&#8249;</span>
            </BackButton>
            <div className="flex gap-2" aria-label="Passo 2 de 3">
              <span className="h-2 w-14 rounded-full bg-violet-100" />
              <span className="h-2 w-14 rounded-full bg-gradient-brand" />
              <span className="h-2 w-14 rounded-full bg-violet-100" />
            </div>
            <span className="w-11" />
          </div>

          <header className="mt-7 text-center">
            <p className="text-lg font-medium text-violet-600">Passo 2 de 3</p>
            <h1 className="mt-2 font-display text-[34px] font-semibold leading-tight">
              Complete seu perfil
            </h1>
            <p className="mx-auto mt-3 max-w-[320px] text-lg leading-7 text-muted-foreground">
              Conte um pouco mais sobre voce para que possamos te conectar melhor.
            </p>
          </header>

          <div className="mt-7 flex flex-col items-center gap-3">
            <div className="relative h-28 w-28">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Sua foto de perfil"
                  className="h-full w-full rounded-full object-cover ring-2 ring-violet-100"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-violet-50 ring-2 ring-violet-100">
                  {initials ? (
                    <span className="text-2xl font-bold text-violet-400">{initials}</span>
                  ) : (
                    <UserRound className="h-10 w-10 text-violet-300" />
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={handleCameraClick}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-white px-3.5 py-2 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-secondary active:scale-[0.97]"
              >
                <Camera className="h-3.5 w-3.5 text-primary" />
                {avatarPreview ? "Tirar outra foto" : "Tirar foto"}
              </button>
              <button
                type="button"
                onClick={handleGalleryClick}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-white px-3.5 py-2 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-secondary active:scale-[0.97]"
              >
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                Escolher da galeria
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-white px-3.5 py-2 text-xs font-medium text-red-500 transition-all hover:border-red-300 hover:bg-red-50 active:scale-[0.97]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover foto
                </button>
              )}
            </div>

            {avatarError && (
              <p className="max-w-[260px] text-center text-xs text-red-500">{avatarError}</p>
            )}

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
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <Field label="Nome completo" icon={UserRound}>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Digite seu nome"
                className="h-14 w-full bg-transparent pr-4 text-lg outline-none placeholder:text-muted-foreground"
              />
            </Field>
            <Field label="Nome de usuario" icon={AtSign}>
              <input
                required
                value={username}
                onChange={(event) => setUsername(event.target.value.replace(/\s/g, ""))}
                placeholder="Escolha um nome de usuario"
                className="h-14 w-full bg-transparent pr-4 text-lg outline-none placeholder:text-muted-foreground"
              />
            </Field>
            <label className="block">
              <span className="mb-2 block text-lg font-medium">Bio</span>
              <span className="relative block rounded-2xl border border-violet-100 bg-white px-4 pt-3 shadow-sm">
                <textarea
                  value={bio}
                  maxLength={160}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Fale sobre voce, seus interesses, paixoes e o que te move."
                  className="h-28 w-full resize-none bg-transparent text-lg leading-7 outline-none placeholder:text-muted-foreground"
                />
                <span className="absolute bottom-3 right-4 text-sm text-muted-foreground">
                  {bio.length}/160
                </span>
              </span>
            </label>
            <Field
              label="Data de nascimento"
              icon={CalendarDays}
              trailing={<ChevronDown className="h-5 w-5 text-muted-foreground" />}
            >
              <input
                required
                type="date"
                value={birthDate}
                max={maxBirthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className="h-14 w-full bg-transparent pr-2 text-lg text-muted-foreground outline-none"
              />
            </Field>

            <button
              type="submit"
              disabled={!canContinue || saving}
              className="mt-7 h-14 w-full rounded-2xl bg-gradient-brand text-xl font-semibold text-white shadow-elegant disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Continuar"}
            </button>
          </form>

          <BackButton
            fallbackTo="/cadastro"
            className="mt-6 block w-full text-center text-lg font-medium text-violet-600"
          >
            Voltar
          </BackButton>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Field({
  label,
  icon: Icon,
  trailing,
  children,
}: {
  label: string;
  icon: typeof UserRound;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-lg font-medium">{label}</span>
      <span className="flex h-14 items-center gap-3 rounded-2xl border border-violet-100 bg-white px-4 shadow-sm">
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
        {children}
        {trailing}
      </span>
    </label>
  );
}
