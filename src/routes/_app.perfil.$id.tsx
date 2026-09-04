import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Coffee,
  Dumbbell,
  Heart,
  LockKeyhole,
  MapPin,
  MoreHorizontal,
  Music2,
  Share2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ConversationInviteButton } from "@/components/chat/conversation-invite-button";
import { BackButton } from "@/components/navigation/back-button";
import { StatusBar } from "@/components/phone-frame";
import { enginePersonById } from "@/lib/engine/engine-detail";
import {
  commonGround,
  currentUser,
  findPerson,
  findPlace,
  people,
  type Moment,
  type Person,
} from "@/lib/mock-data";
import { supabase } from "@/lib/supabase/client";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import type { ProfileRow } from "@/types/database/tables";

const searchSchema = z.object({
  from: z.enum(["solicitacao", "chat", "connecta", "home", "reels"]).optional(),
});

export const Route = createFileRoute("/_app/perfil/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Perfil de ${params.id} — Connexy` },
      {
        name: "description",
        content: "Conheça interesses, lugares e atividades compartilhadas deste perfil.",
      },
    ],
  }),
  validateSearch: searchSchema,
  shouldReload: true,
  loader: async ({ params }) => {
    const person = findPerson(params.id) ?? enginePersonById(params.id);
    if (person) return person;
    if (!isPublicSupabaseConfigured()) throw notFound();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.id)) throw notFound();
    const loaderSupabase = import.meta.env.SSR
      ? await import("@/lib/supabase/server.server").then(({ createServerSupabaseClient }) =>
          createServerSupabaseClient(),
        )
      : supabase;

    const { data: profileRow, error: profileError } = await loaderSupabase
      .from("profiles")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (profileError) throw new Error("Não foi possível carregar este perfil.");
    if (!profileRow) throw notFound();

    const { data: postsRows, error: postsError } = await loaderSupabase
      .from("bio_posts")
      .select("*")
      .eq("author_id", params.id)
      .order("created_at", { ascending: false });
    if (postsError) throw new Error("Não foi possível carregar as publicações deste perfil.");

    const row = profileRow as ProfileRow;
    const moments: Moment[] = (postsRows ?? []).map((post: Record<string, unknown>) => ({
      id: post.id as string,
      text: (post.text as string) || "",
      mediaUrl: typeof post.media_url === "string" ? post.media_url : undefined,
      mediaKind:
        post.media_kind === "image" || post.media_kind === "video" ? post.media_kind : null,
      createdAgo: post.created_at
        ? new Date(post.created_at as string).toLocaleDateString("pt-BR")
        : "",
      likes: 0,
    }));

    return {
      id: row.id,
      name: row.name ?? "Usuário",
      handle: row.handle ?? undefined,
      age: row.age ?? 25,
      photo: row.photo_url ?? "",
      headline: row.headline ?? undefined,
      bio: row.bio ?? undefined,
      distanceMeters: 0,
      online: false,
      interests: (row.interests as string[]) ?? [],
      vibeTags: (row.vibe_tags as string[]) ?? [],
      looksFor: (row.looks_for as string[]) ?? [],
      mood: row.mood_emoji ? { emoji: row.mood_emoji, text: row.mood_text ?? "" } : undefined,
      nowPlaying:
        row.now_playing_kind && row.now_playing_title
          ? {
              kind: row.now_playing_kind as "music" | "reading" | "watching",
              title: row.now_playing_title,
              subtitle: row.now_playing_subtitle ?? undefined,
            }
          : undefined,
      moments,
      stats: undefined,
    } satisfies Person;
  },
  errorComponent: ProfileLoadError,
  notFoundComponent: () => <div className="p-6 text-sm">Perfil não encontrado.</div>,
  component: ViewedProfile,
});

const coverImages = [
  "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200",
  "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=1200",
  "https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=1200",
];

const fallbackPublicationImages = [
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=640",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=640",
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=640",
  "https://images.unsplash.com/photo-1511081692775-05d0f180a065?w=640",
];

function ProfileLoadError() {
  const router = useRouter();
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm text-muted-foreground">Não foi possível carregar este perfil.</p>
      <button
        type="button"
        onClick={() => router.invalidate()}
        className="rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-white"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function ViewedProfile() {
  const person = Route.useLoaderData() as Person;
  const isOwnProfile = person.id === currentUser.id;
  const common = commonGround(person);
  const favoritePlaces = useMemo(
    () => (person.favoritePlaceIds ?? []).map(findPlace).filter(Boolean),
    [person.favoritePlaceIds],
  );
  const displayPlaces = useMemo(
    () =>
      [
        ...favoritePlaces,
        findPlace("cafe-central"),
        findPlace("sunset-parque"),
        findPlace("vinil-store"),
      ]
        .filter(
          (place, index, list) =>
            place && list.findIndex((item) => item?.id === place.id) === index,
        )
        .slice(0, 4),
    [favoritePlaces],
  );
  const sharedFriends = people
    .filter((candidate) => candidate.id !== person.id && candidate.id !== currentUser.id)
    .slice(0, 6);
  const firstName = person.name.split(" ")[0];
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [publicationTab, setPublicationTab] = useState<"Tudo" | "Fotos" | "Momentos">("Tudo");

  const publicationImages = useMemo(() => {
    const momentImages = (person.moments ?? [])
      .map((moment) => moment.mediaUrl ?? moment.photo)
      .filter((source): source is string => Boolean(source));
    const placeImages = displayPlaces.map((place) => place?.cover).filter(Boolean) as string[];
    return [...new Set([...momentImages, ...placeImages, ...fallbackPublicationImages])].slice(
      0,
      8,
    );
  }, [displayPlaces, person.moments]);
  const visiblePublicationImages =
    publicationTab === "Tudo"
      ? publicationImages
      : publicationTab === "Fotos"
        ? publicationImages.filter((_, index) => index % 2 === 0)
        : publicationImages.filter((_, index) => index % 2 === 1);

  const cover = coverImages[person.name.length % coverImages.length];
  const sharedInterestCount = common.sharedInterests.length;
  const stats = {
    connections: person.stats?.connections ?? 128,
    publications: Math.max(person.moments?.length ?? 0, 24),
    places: Math.max(favoritePlaces.length, 35),
  };

  async function shareProfile() {
    const shareData = {
      title: `Perfil de ${person.name} no Connexy`,
      text: `Conheça ${person.name} no Connexy.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
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
      <div className="pointer-events-none absolute -left-12 top-56 h-36 w-36 rounded-full bg-primary/[0.05]" />
      <div className="pointer-events-none absolute -right-14 top-72 h-28 w-28 rounded-full bg-amber-300/[0.08]" />
      <StatusBar />

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/20 bg-background/85 px-4 backdrop-blur-2xl">
        <BackButton
          fallbackTo="/pessoas"
          className="grid h-10 w-10 place-items-center rounded-full transition active:scale-95"
          ariaLabel="Voltar"
        />
        <h1 className="font-display text-xl font-bold tracking-tight">Perfil</h1>
        <div className="flex items-center gap-1">
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
            onClick={() =>
              toast("Opções do perfil", {
                description: "Denunciar e bloquear estarão disponíveis aqui.",
              })
            }
            aria-label="Mais opções"
            className="grid h-10 w-10 place-items-center rounded-full transition active:scale-95"
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <svg
          viewBox="0 0 420 194"
          preserveAspectRatio="none"
          className="block h-[194px] w-full"
          role="img"
          aria-label={`Paisagem de capa de ${person.name}`}
        >
          <defs>
            <clipPath id="viewed-profile-cover">
              <path d="M0 14C54 0 112 9 174 14C252 20 333 5 420 16V148C382 162 346 149 301 159C250 171 211 166 160 181C96 200 35 177 0 146V14Z" />
            </clipPath>
            <linearGradient id="viewed-profile-cover-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0.62" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.13" />
            </linearGradient>
          </defs>
          <image
            href={cover}
            width="420"
            height="194"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#viewed-profile-cover)"
          />
          <path
            d="M0 14C54 0 112 9 174 14C252 20 333 5 420 16V148C382 162 346 149 301 159C250 171 211 166 160 181C96 200 35 177 0 146V14Z"
            fill="url(#viewed-profile-cover-shade)"
          />
        </svg>

        <div
          className="pointer-events-none absolute inset-x-0 top-[152px] h-[360px] overflow-hidden"
          aria-hidden
        >
          <span className="absolute -left-7 top-12 h-20 w-20 rounded-full bg-primary/[0.045]" />
          <span className="absolute left-5 top-32 h-14 w-14 rounded-full bg-primary/[0.055]" />
          <span className="absolute -right-8 top-20 h-24 w-24 rounded-full bg-amber-300/[0.075]" />
          <span className="absolute right-7 top-40 h-14 w-14 rounded-full bg-primary/[0.045]" />
        </div>

        <div className="relative -mt-[78px] px-5 text-center">
          <div className="mx-auto h-[136px] w-[136px]">
            {!person.photo || avatarFailed ? (
              <div className="grid h-full w-full place-items-center rounded-full border-4 border-background bg-secondary text-primary shadow-xl">
                <span className="text-3xl font-bold">
                  {getProfileInitials(person.name, person.handle)}
                </span>
              </div>
            ) : (
              <img
                src={person.photo}
                alt={`Foto de ${person.name}`}
                onError={() => setAvatarFailed(true)}
                className="h-full w-full rounded-full border-4 border-background object-cover shadow-xl"
              />
            )}
          </div>
          <h2 className="mt-3 font-display text-[30px] font-bold leading-none tracking-[-0.035em]">
            {person.name}
          </h2>
          {person.handle && <p className="mt-1 text-sm text-muted-foreground">@{person.handle}</p>}
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            {profileCity(person)}
            <MapPin className="h-4 w-4 text-primary" strokeWidth={2.2} />
          </p>
          <p className="mx-auto mt-2 max-w-[320px] text-sm leading-relaxed text-muted-foreground">
            {person.bio ??
              person.headline ??
              "Boas conversas, novos lugares e experiências ao redor."}
          </p>
        </div>
      </motion.section>

      {!isOwnProfile && (
        <section className="mx-auto mt-5 w-full max-w-[230px] px-4">
          <ConversationInviteButton
            personId={person.id}
            personName={person.name}
            variant="profile"
            className="h-11 w-full rounded-full text-[14px]"
          />
        </section>
      )}

      <section className="mx-4 mt-5 grid grid-cols-3 rounded-2xl border border-border/70 bg-surface/70 py-3 text-center shadow-soft backdrop-blur-xl">
        <ProfileStat value={stats.connections} label="Conexões" />
        <ProfileStat value={stats.publications} label="Publicações" divider />
        <ProfileStat value={stats.places} label="Lugares" />
      </section>

      {person.interests.length > 0 && (
        <section className="mt-4 overflow-x-auto px-4 no-scrollbar">
          <div className="flex min-w-max gap-2">
            {person.interests.slice(0, 5).map((interest) => (
              <span
                key={interest}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.055] px-4 text-xs font-semibold text-primary"
              >
                <InterestIcon interest={interest} />
                {interest}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="mx-5 mt-4 flex items-center gap-2 text-xs text-foreground">
        <UsersRound className="h-4 w-4 text-primary" />
        <span>
          Vocês têm{" "}
          <strong className="font-semibold text-primary">
            {sharedInterestCount} {sharedInterestCount === 1 ? "interesse" : "interesses"} em comum
          </strong>
        </span>
      </div>

      <ProfileSection title="Amigos em comum" action="12 amigos em comum">
        <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
          {sharedFriends.map((friend) => (
            <Link
              key={friend.id}
              to="/perfil/$id"
              params={{ id: friend.id }}
              className="w-[54px] shrink-0 text-center"
            >
              <img
                src={friend.photo}
                alt=""
                className="h-[54px] w-[54px] rounded-full object-cover"
              />
              <span className="mt-1.5 block truncate text-[11px] text-foreground">
                {friend.name}
              </span>
            </Link>
          ))}
        </div>
      </ProfileSection>

      {displayPlaces.length > 0 && (
        <ProfileSection title="Lugares que curtiu">
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {displayPlaces.map(
              (place) =>
                place && (
                  <Link
                    key={place.id}
                    to="/local/$id"
                    params={{ id: place.id }}
                    className="w-[148px] shrink-0"
                  >
                    <div className="relative">
                      <img
                        src={place.cover}
                        alt=""
                        className="h-[76px] w-full rounded-[50%] object-cover"
                      />
                      <span className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-background text-[#ff604b] shadow-md">
                        <Heart className="h-3.5 w-3.5 fill-current" />
                      </span>
                    </div>
                    <span className="mt-1.5 block truncate text-center text-[11px] text-muted-foreground">
                      {place.name}
                    </span>
                  </Link>
                ),
            )}
          </div>
        </ProfileSection>
      )}

      <ProfileSection
        title="Atividade compartilhada"
        action={
          <span className="inline-flex items-center gap-1">
            <LockKeyhole className="h-3.5 w-3.5" /> Compartilhado por {firstName}
          </span>
        }
      >
        <div className="space-y-3">
          <ActivityItem icon={CalendarDays} text="Confirmou presença em um evento próximo" />
          <ActivityItem
            icon={Heart}
            text={`Curtiu ${displayPlaces[0]?.name ?? "um lugar da região"}`}
          />
          <ActivityItem
            icon={MapPin}
            text={`Fez check-in no ${displayPlaces[1]?.name ?? "bairro"}`}
          />
        </div>
      </ProfileSection>

      <section className="mt-6 px-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-bold">Publicações</h3>
          <div className="flex items-center gap-1">
            {(["Tudo", "Fotos", "Momentos"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPublicationTab(tab)}
                className={`rounded-full px-3 py-1.5 text-[11px] transition ${
                  publicationTab === tab
                    ? "bg-primary/[0.09] font-semibold text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5 overflow-hidden rounded-2xl">
          {visiblePublicationImages.map((source, index) => (
            <button
              key={`${source}-${index}`}
              type="button"
              onClick={() =>
                toast("Publicação aberta", {
                  description: `Conteúdo compartilhado por ${firstName}.`,
                })
              }
              className="aspect-square overflow-hidden bg-secondary"
              aria-label={`Abrir publicação ${index + 1}`}
            >
              <img
                src={source}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function ProfileStat({
  value,
  label,
  divider = false,
}: {
  value: number;
  label: string;
  divider?: boolean;
}) {
  return (
    <div className={divider ? "border-x border-border/70" : ""}>
      <p className="font-display text-lg font-semibold leading-tight">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ProfileSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-6 px-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
        {action && <div className="shrink-0 text-[11px] text-muted-foreground">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function ActivityItem({
  icon: Icon,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-white">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate">{text}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
    </div>
  );
}

function InterestIcon({ interest }: { interest: string }) {
  const normalized = interest.toLowerCase();
  if (normalized.includes("música")) return <Music2 className="h-4 w-4" />;
  if (normalized.includes("café") || normalized.includes("gastronomia"))
    return <Coffee className="h-4 w-4" />;
  if (normalized.includes("esporte") || normalized.includes("corrida"))
    return <Dumbbell className="h-4 w-4" />;
  if (normalized.includes("fotografia") || normalized.includes("arte"))
    return <Camera className="h-4 w-4" />;
  if (normalized.includes("evento")) return <CalendarDays className="h-4 w-4" />;
  return <Sparkles className="h-4 w-4" />;
}

function profileCity(person: Person): string {
  return person.id === "rafael" ? "Rio de Janeiro" : "Na sua região";
}

function getProfileInitials(name?: string, handle?: string): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (handle ?? "").trim().charAt(0).toUpperCase() || "?";
}
