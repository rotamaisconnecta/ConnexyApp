import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Coffee,
  Dumbbell,
  Eye,
  Heart,
  Home,
  Lock,
  MapPin,
  Music2,
  PenLine,
  Plus,
  Settings,
  Share2,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { StatusBar } from "@/components/phone-frame";
import {
  saveDemoOwnProfile,
  useDemoOwnProfile,
  type DemoOwnProfile,
  type ProfileVisibility,
} from "@/lib/demo/demo-own-profile";
import { currentUser, findPlace, people } from "@/lib/mock-data";

const searchSchema = z.object({
  edit: z.boolean().optional(),
});

export const Route = createFileRoute("/_app/perfil/")({
  head: () => ({ meta: [{ title: "Meu perfil — Connexy" }] }),
  validateSearch: searchSchema,
  component: OwnProfile,
});

const predefinedInterests = [
  "Fotografia",
  "Música",
  "Cafés",
  "Corrida",
  "Viagens",
  "Tecnologia",
  "Arte",
  "Cinema",
  "Eventos",
  "Negócios",
];

const publicationImages = [
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=640",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=640",
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=640",
  "https://images.unsplash.com/photo-1511081692775-05d0f180a065?w=640",
];

type UpdateProfile = <K extends keyof DemoOwnProfile>(key: K, value: DemoOwnProfile[K]) => void;
type PublicationTab = "Tudo" | "Fotos" | "Momentos";
type AddressKey = keyof DemoOwnProfile["privateAddresses"];
type VisibilityKey = keyof DemoOwnProfile["visibility"];

function OwnProfile() {
  const profile = useDemoOwnProfile();
  const { edit = false } = Route.useSearch();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(profile);

  useEffect(() => {
    setDraft(profile);
  }, [edit, profile]);

  const update: UpdateProfile = (key, value) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
  };

  const toggleInterest = (value: string) => {
    update(
      "interests",
      draft.interests.includes(value)
        ? draft.interests.filter((item) => item !== value)
        : [...draft.interests, value],
    );
  };

  const openEditor = () => navigate({ to: "/perfil", search: { edit: true } });
  const closeEditor = () => navigate({ to: "/perfil", search: {}, replace: true });

  const save = () => {
    const name = draft.name.trim();
    const handle = draft.handle.trim().replace(/^@/, "");
    const city = draft.city.trim();

    if (!name || !handle || !city) {
      toast.error("Preencha nome, nome de usuário e cidade.");
      return;
    }

    try {
      saveDemoOwnProfile({
        ...draft,
        name,
        handle,
        city,
        bio: draft.bio.trim(),
        interests: uniqueInterests(draft.interests),
      });
      closeEditor();
      toast.success("Alterações salvas neste dispositivo.");
    } catch {
      toast.error("Não foi possível salvar. Tente usar imagens menores.");
    }
  };

  return edit ? (
    <Editor
      draft={draft}
      update={update}
      toggleInterest={toggleInterest}
      save={save}
      cancel={closeEditor}
    />
  ) : (
    <Profile profile={profile} edit={openEditor} />
  );
}

function Profile({ profile, edit }: { profile: DemoOwnProfile; edit: () => void }) {
  const [publicationTab, setPublicationTab] = useState<PublicationTab>("Tudo");
  const places = [
    ...(currentUser.favoritePlaceIds ?? []).map(findPlace),
    findPlace("cafe-central"),
    findPlace("sunset-parque"),
    findPlace("vinil-store"),
  ]
    .filter(
      (place, index, list) =>
        place && list.findIndex((candidate) => candidate?.id === place.id) === index,
    )
    .slice(0, 3);

  const gallery = useMemo(() => {
    const placeImages = places.map((place) => place?.cover).filter(Boolean) as string[];
    return [...new Set([...placeImages, ...publicationImages])];
  }, [places]);

  const visibleGallery =
    publicationTab === "Tudo"
      ? gallery
      : publicationTab === "Fotos"
        ? gallery.filter((_, index) => index % 2 === 0)
        : gallery.filter((_, index) => index % 2 === 1);

  async function shareProfile() {
    const data = {
      title: `${profile.name} no Connexy`,
      text: `Veja o perfil de ${profile.name} no Connexy.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link do perfil copiado.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Não foi possível compartilhar o perfil.");
    }
  }

  return (
    <main className="relative min-h-full overflow-hidden bg-background pb-6">
      <ProfileBubbles />
      <StatusBar />

      <header className="relative z-20 flex h-14 items-center justify-between px-4">
        <Link
          to="/home"
          aria-label="Voltar para a Home"
          className="grid h-10 w-10 place-items-center rounded-full transition active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-xl font-bold tracking-tight">Meu perfil</h1>
        <div className="flex items-center">
          <button
            type="button"
            onClick={shareProfile}
            aria-label="Compartilhar perfil"
            className="grid h-10 w-10 place-items-center rounded-full transition active:scale-95"
          >
            <Share2 className="h-5 w-5" strokeWidth={1.9} />
          </button>
          <button
            type="button"
            onClick={edit}
            aria-label="Editar perfil"
            className="grid h-10 w-10 place-items-center rounded-full transition active:scale-95"
          >
            <Settings className="h-5 w-5" strokeWidth={1.9} />
          </button>
        </div>
      </header>

      <section className="relative z-10">
        <OrganicCover src={profile.cover} alt={`Paisagem de capa de ${profile.name}`} />
        <div className="relative -mt-[82px] px-5 text-center">
          <div className="relative mx-auto h-[116px] w-[116px]">
            <img
              src={profile.photo}
              alt={`Foto de ${profile.name}`}
              className="h-full w-full rounded-full border-4 border-background object-cover shadow-xl"
            />
            <span
              aria-label="Perfil verificado"
              className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full border-[3px] border-background bg-gradient-brand text-white"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </div>
          <h2 className="mt-2 font-display text-[27px] font-bold leading-none tracking-[-0.035em]">
            {profile.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">@{profile.handle}</p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            {profile.city}
            <MapPin className="h-4 w-4 text-primary" strokeWidth={2.2} />
          </p>
          <p className="mx-auto mt-2 max-w-[320px] whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {profile.bio}
          </p>
        </div>
      </section>

      <div className="relative z-10 mt-5 flex justify-center px-4">
        <Link
          to="/create-post"
          className="flex h-11 w-[min(76%,280px)] items-center justify-center gap-2 rounded-full bg-gradient-brand text-sm font-semibold text-white shadow-soft transition active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nova publicação
        </Link>
      </div>

      <section className="relative z-10 mx-4 mt-4 grid grid-cols-3 rounded-2xl border border-border/70 bg-surface/75 py-3 text-center shadow-soft backdrop-blur-xl">
        <Stat value="128" label="Conexões" />
        <Stat value="24" label="Publicações" divider />
        <Stat value="35" label="Lugares" />
      </section>

      {profile.interests.length > 0 && (
        <div className="relative z-10 mt-3 flex gap-2 overflow-x-auto px-4 no-scrollbar">
          {profile.interests.map((item) => {
            const Icon = interestIcon(item);
            return (
              <span
                key={item}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-xs font-semibold text-primary"
              >
                <Icon className="h-3.5 w-3.5" />
                {item}
              </span>
            );
          })}
        </div>
      )}

      <Section title="Amigos em comum" action="12 amigos em comum">
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {people.slice(0, 6).map((person) => (
            <Link
              key={person.id}
              to="/perfil/$id"
              params={{ id: person.id }}
              className="w-14 shrink-0 text-center"
            >
              <img
                src={person.photo}
                alt={`Foto de ${person.name}`}
                className="mx-auto h-12 w-12 rounded-full object-cover ring-2 ring-background shadow-soft"
              />
              <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                {person.name.split(" ")[0]}
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Lugares que curtiu">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {places.map(
            (place) =>
              place && (
                <Link
                  key={place.id}
                  to="/local/$id"
                  params={{ id: place.id }}
                  className="w-36 shrink-0"
                >
                  <div className="relative">
                    <img
                      src={place.cover}
                      alt={`Foto de ${place.name}`}
                      className="h-[74px] w-full rounded-[24px] object-cover"
                    />
                    <span className="absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-white text-[#f26b4a] shadow-soft">
                      <Heart className="h-3.5 w-3.5 fill-current" />
                    </span>
                  </div>
                  <span className="mt-1 block truncate text-center text-xs text-muted-foreground">
                    {place.name}
                  </span>
                </Link>
              ),
          )}
        </div>
      </Section>

      <Section
        title="Minha atividade"
        action={
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/80 px-2.5 py-1">
            <Eye className="h-3 w-3 text-primary" />
            Visibilidade da atividade
          </span>
        }
      >
        <div className="relative space-y-3 pl-1 text-sm before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-primary/20">
          {[
            ["Confirmou presença em Som na Praça", "Hoje", Check],
            ["Curtiu Café Aurora", "Ontem", Heart],
            ["Fez check-in no Parque das Artes", "2 dias atrás", MapPin],
            ["Publicou um novo momento", "3 dias atrás", PenLine],
          ].map(([label, date, ActivityIcon]) => {
            const Icon = ActivityIcon as LucideIcon;
            return (
              <div key={String(label)} className="relative flex items-center gap-3">
                <span className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-brand text-white shadow-soft">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px]">{String(label)}</span>
                <span className="text-[10px] text-muted-foreground">{String(date)}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Publicações">
        <div className="-mt-9 mb-3 ml-auto flex w-fit items-center gap-1 rounded-full bg-secondary/70 p-1">
          {(["Tudo", "Fotos", "Momentos"] as PublicationTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPublicationTab(tab)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                publicationTab === tab
                  ? "bg-background text-primary shadow-soft"
                  : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {visibleGallery.slice(0, 8).map((source, index) => (
            <img
              key={`${source}-${index}`}
              src={source}
              alt={`Publicação ${index + 1}`}
              className="aspect-square w-full rounded-xl object-cover"
            />
          ))}
        </div>
      </Section>
    </main>
  );
}

function Editor({
  draft,
  update,
  toggleInterest,
  save,
  cancel,
}: {
  draft: DemoOwnProfile;
  update: UpdateProfile;
  toggleInterest: (value: string) => void;
  save: () => void;
  cancel: () => void;
}) {
  const [customInterest, setCustomInterest] = useState("");
  const [openAddress, setOpenAddress] = useState<AddressKey | null>(null);

  const updateAddress = (key: AddressKey, value: string) => {
    update("privateAddresses", { ...draft.privateAddresses, [key]: value });
  };

  const updateVisibility = (key: VisibilityKey, value: ProfileVisibility) => {
    update("visibility", { ...draft.visibility, [key]: value });
  };

  const addCustomInterest = () => {
    const interest = customInterest.trim().replace(/\s+/g, " ");
    if (!interest) return;
    if (
      draft.interests.some(
        (item) => item.toLocaleLowerCase("pt-BR") === interest.toLocaleLowerCase("pt-BR"),
      )
    ) {
      toast("Esse interesse já foi adicionado.");
      return;
    }
    if (draft.interests.length >= 12) {
      toast.error("Você pode escolher até 12 interesses.");
      return;
    }
    update("interests", [...draft.interests, interest]);
    setCustomInterest("");
  };

  const pickImage = (key: "photo" | "cover", file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Escolha uma imagem de até 4 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => update(key, String(reader.result));
    reader.onerror = () => toast.error("Não foi possível carregar a imagem.");
    reader.readAsDataURL(file);
  };

  return (
    <main className="relative min-h-full overflow-hidden bg-background pb-8">
      <ProfileBubbles />
      <StatusBar />

      <header className="relative z-20 flex h-14 items-center justify-between px-4">
        <button
          type="button"
          onClick={cancel}
          aria-label="Cancelar edição"
          className="grid h-10 w-10 place-items-center rounded-full transition active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-bold tracking-tight">Editar perfil</h1>
        <span className="h-10 w-10" aria-hidden />
      </header>

      <section className="relative z-10">
        <OrganicCover src={draft.cover} alt="Imagem de capa atual" editor>
          <label className="absolute bottom-7 right-5 grid h-10 w-10 cursor-pointer place-items-center rounded-full border-4 border-background bg-gradient-brand text-white shadow-lg transition active:scale-95">
            <Camera className="h-4 w-4" />
            <span className="sr-only">Alterar imagem de capa</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => pickImage("cover", event.target.files?.[0])}
            />
          </label>
        </OrganicCover>
        <div className="relative -mt-[78px] h-[118px]">
          <div className="absolute left-1/2 h-[112px] w-[112px] -translate-x-1/2">
            <img
              src={draft.photo}
              alt={`Foto de ${draft.name}`}
              className="h-full w-full rounded-full border-4 border-background object-cover shadow-xl"
            />
            <label className="absolute bottom-0 right-0 grid h-9 w-9 cursor-pointer place-items-center rounded-full border-[3px] border-background bg-gradient-brand text-white shadow-lg transition active:scale-95">
              <Camera className="h-4 w-4" />
              <span className="sr-only">Alterar foto do perfil</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => pickImage("photo", event.target.files?.[0])}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-4 mt-5 space-y-3">
        <Field label="Nome" value={draft.name} change={(value) => update("name", value)} />
        <Field
          label="Nome de usuário"
          value={`@${draft.handle}`}
          change={(value) => update("handle", value.replace(/^@/, ""))}
        />
        <label className="block text-xs font-medium text-muted-foreground">
          Bio
          <textarea
            rows={3}
            value={draft.bio}
            maxLength={180}
            onChange={(event) => update("bio", event.target.value)}
            className="mt-1.5 w-full resize-none rounded-xl border border-border bg-surface/85 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
          <span className="mt-1 block text-right text-[10px] text-muted-foreground">
            {draft.bio.length}/180
          </span>
        </label>
        <Field
          label="Cidade e região"
          value={draft.city}
          change={(value) => update("city", value)}
        />
      </section>

      <section className="relative z-10 mx-4 mt-6">
        <h2 className="font-display text-base font-bold">Endereços privados</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-soft backdrop-blur-xl">
          <AddressRow
            icon={Home}
            label="Casa"
            value={draft.privateAddresses.home}
            open={openAddress === "home"}
            toggle={() => setOpenAddress((current) => (current === "home" ? null : "home"))}
            change={(value) => updateAddress("home", value)}
          />
          <AddressRow
            icon={BriefcaseBusiness}
            label="Trabalho"
            value={draft.privateAddresses.work}
            open={openAddress === "work"}
            toggle={() => setOpenAddress((current) => (current === "work" ? null : "work"))}
            change={(value) => updateAddress("work", value)}
          />
        </div>
        <p className="mt-2 px-2 text-[10px] leading-relaxed text-muted-foreground">
          Seus endereços ajudam nas rotas e nunca aparecem no perfil público.
        </p>
      </section>

      <section className="relative z-10 mx-4 mt-6">
        <h2 className="font-display text-base font-bold">Interesses</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {predefinedInterests.map((item) => {
            const selected = draft.interests.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleInterest(item)}
                aria-pressed={selected}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  selected
                    ? "border-primary/25 bg-primary/[0.09] text-primary"
                    : "border-border bg-surface/80 text-muted-foreground"
                }`}
              >
                {selected && <Check className="mr-1 inline h-3.5 w-3.5" />}
                {item}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={customInterest}
            maxLength={32}
            onChange={(event) => setCustomInterest(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomInterest();
              }
            }}
            placeholder="Escreva outro interesse"
            aria-label="Novo interesse personalizado"
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface/85 px-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
          <button
            type="button"
            onClick={addCustomInterest}
            disabled={!customInterest.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white shadow-soft transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Adicionar interesse"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        {draft.interests.some((item) => !predefinedInterests.includes(item)) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {draft.interests
              .filter((item) => !predefinedInterests.includes(item))
              .map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleInterest(item)}
                  aria-label={`Remover interesse ${item}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-2 text-xs font-semibold text-primary"
                >
                  {item}
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
          </div>
        )}
      </section>

      <section className="relative z-10 mx-4 mt-6">
        <h2 className="font-display text-base font-bold">Quem pode ver</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-soft backdrop-blur-xl">
          <PrivacyRow
            label="Atividade confirmada"
            value={draft.visibility.confirmedActivity}
            change={(value) => updateVisibility("confirmedActivity", value)}
          />
          <PrivacyRow
            label="Lugares curtidos"
            value={draft.visibility.likedPlaces}
            change={(value) => updateVisibility("likedPlaces", value)}
          />
          <PrivacyRow
            label="Amigos em comum"
            value={draft.visibility.mutualFriends}
            change={(value) => updateVisibility("mutualFriends", value)}
          />
        </div>
      </section>

      <div className="relative z-10 mx-4 mt-7 space-y-2">
        <button
          type="button"
          onClick={save}
          className="h-12 w-full rounded-xl bg-gradient-brand text-sm font-semibold text-white shadow-soft transition active:scale-[0.99]"
        >
          Salvar alterações
        </button>
        <button
          type="button"
          onClick={cancel}
          className="h-11 w-full text-sm font-semibold text-primary"
        >
          Cancelar
        </button>
      </div>
    </main>
  );
}

function OrganicCover({
  src,
  alt,
  editor = false,
  children,
}: {
  src: string;
  alt: string;
  editor?: boolean;
  children?: ReactNode;
}) {
  const clipId = editor ? "own-profile-edit-cover" : "own-profile-cover";
  const gradientId = editor ? "own-profile-edit-shade" : "own-profile-shade";

  return (
    <div className="relative h-[174px] w-full">
      <svg
        viewBox="0 0 420 174"
        preserveAspectRatio="none"
        className="block h-[174px] w-full"
        role="img"
        aria-label={alt}
      >
        <defs>
          <clipPath id={clipId}>
            <path d="M0 14C55 0 113 9 175 14C253 20 334 5 420 16V133C385 147 349 135 305 145C252 158 214 153 163 166C99 183 37 166 0 139V14Z" />
          </clipPath>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.58" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <image
          href={src}
          width="420"
          height="174"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
        <path
          d="M0 14C55 0 113 9 175 14C253 20 334 5 420 16V133C385 147 349 135 305 145C252 158 214 153 163 166C99 183 37 166 0 139V14Z"
          fill={`url(#${gradientId})`}
        />
      </svg>
      {children}
    </div>
  );
}

function ProfileBubbles() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[195px] h-[360px] overflow-hidden"
      aria-hidden
    >
      <span className="absolute -left-7 top-8 h-20 w-20 rounded-full bg-primary/[0.045]" />
      <span className="absolute left-6 top-28 h-12 w-12 rounded-full bg-primary/[0.055]" />
      <span className="absolute -right-8 top-16 h-24 w-24 rounded-full bg-amber-300/[0.07]" />
      <span className="absolute right-7 top-36 h-14 w-14 rounded-full bg-primary/[0.04]" />
    </div>
  );
}

function Field({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <input
        value={value}
        onChange={(event) => change(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface/85 px-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
      />
    </label>
  );
}

function Stat({
  value,
  label,
  divider = false,
}: {
  value: string;
  label: string;
  divider?: boolean;
}) {
  return (
    <div className={divider ? "border-x border-border" : ""}>
      <p className="font-display text-base font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="relative z-10 mx-4 mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold">{title}</h2>
        {action && <span className="text-[10px] text-muted-foreground">{action}</span>}
      </div>
      {children}
    </section>
  );
}

function AddressRow({
  icon: Icon,
  label,
  value,
  open,
  toggle,
  change,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  open: boolean;
  toggle: () => void;
  change: (value: string) => void;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/[0.08] text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{label}</span>
          <span className="block truncate text-[10px] text-muted-foreground">Somente você</span>
        </span>
        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <input
            autoFocus
            value={value}
            onChange={(event) => change(event.target.value)}
            placeholder={`Digite o endereço de ${label.toLocaleLowerCase("pt-BR")}`}
            aria-label={`Endereço de ${label}`}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Usado somente para sugestões de rotas.
          </div>
        </div>
      )}
    </div>
  );
}

function PrivacyRow({
  label,
  value,
  change,
}: {
  label: string;
  value: ProfileVisibility;
  change: (value: ProfileVisibility) => void;
}) {
  return (
    <label className="relative flex w-full items-center gap-3 border-b border-border px-4 py-3 last:border-0">
      <span className="min-w-0 flex-1 text-sm">{label}</span>
      <select
        value={value}
        onChange={(event) => change(event.target.value as ProfileVisibility)}
        aria-label={`Quem pode ver ${label.toLocaleLowerCase("pt-BR")}`}
        className="appearance-none bg-transparent py-1 pl-2 pr-6 text-right text-[11px] font-medium text-muted-foreground outline-none"
      >
        <option>Todos</option>
        <option>Conexões</option>
        <option>Somente você</option>
      </select>
      <ChevronRight className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
    </label>
  );
}

function interestIcon(interest: string): LucideIcon {
  const normalized = interest.toLocaleLowerCase("pt-BR");
  if (normalized.includes("foto")) return Camera;
  if (normalized.includes("música") || normalized.includes("musica")) return Music2;
  if (normalized.includes("café") || normalized.includes("cafe")) return Coffee;
  if (normalized.includes("corrida") || normalized.includes("esporte")) return Dumbbell;
  return Sparkles;
}

function uniqueInterests(interests: string[]): string[] {
  const seen = new Set<string>();
  return interests
    .map((interest) => interest.trim())
    .filter((interest) => {
      if (!interest) return false;
      const normalized = interest.toLocaleLowerCase("pt-BR");
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .slice(0, 12);
}