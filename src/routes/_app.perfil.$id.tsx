import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { PresenceDot } from "@/components/presence-dot";
import { findPerson, findPlace, commonGround, currentUser, type Moment, type Person } from "@/lib/mock-data";
import { personProximityLabel, personProximityRadius } from "@/lib/proximity";
import { ChevronLeft, MoreVertical, MapPin, Music, BookOpen, Film, Heart, Sparkles, Users, Handshake, CalendarCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  from: z.enum(["solicitacao", "chat", "connecta", "home"]).optional(),
});

export const Route = createFileRoute("/_app/perfil/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Perfil de ${params.id} — Connecta` },
      { name: "description", content: "Conheça a bio, momentos e locais favoritos antes de iniciar a conversa." },
    ],
  }),
  validateSearch: searchSchema,
  loader: ({ params }) => {
    const person = findPerson(params.id);
    if (!person) throw notFound();
    return person;
  },
  errorComponent: ({ error }) => <div className="p-6 text-sm">{error.message}</div>,
  notFoundComponent: () => <div className="p-6 text-sm">Perfil não encontrado.</div>,
  component: Perfil,
});

function Perfil() {
  const p = Route.useLoaderData() as Person;
  const { from } = Route.useSearch();
  const nav = useNavigate();
  const cg = commonGround(p);
  const label = personProximityLabel(p.distanceMeters);
  const radius = personProximityRadius(p.distanceMeters);

  const favPlaces = (p.favoritePlaceIds ?? []).map(findPlace).filter(Boolean);
  const commonPlaces = cg.sharedPlaces.map(findPlace).filter(Boolean);

  const back = from === "solicitacao" ? "/solicitacao/$id" : from === "chat" ? "/chat/$id" : "/connecta";

  return (
    <div className="flex-1 flex flex-col pb-24">
      <StatusBar />
      <div className="flex items-center justify-between px-4 pt-1 pb-2">
        <Link
          to={back as "/connecta"}
          {...(back !== "/connecta" ? { params: { id: p.id } } : {})}
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <button className="h-9 w-9 grid place-items-center rounded-full bg-secondary" aria-label="Mais opções">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Vibe Hero */}
      <motion.section
        initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="mx-4 rounded-3xl overflow-hidden shadow-elegant border border-border"
      >
        <div className="relative p-5 pt-4 bg-gradient-brand text-white">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="relative">
              <img src={p.photo} alt={p.name} className="h-24 w-24 rounded-3xl object-cover ring-4 ring-white/30" />
              <PresenceDot online={p.online} size={16} className="absolute -bottom-1 -right-1" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="font-display text-2xl font-bold leading-tight">{p.name}, {p.age}</h1>
              {p.handle && <div className="text-xs opacity-90">@{p.handle}</div>}
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-2.5 py-1 text-[11px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                {p.online ? "online" : `visto ${p.lastSeen ?? "há pouco"}`}
                <span className="opacity-70">·</span>
                <span>{label}{radius ? ` · ${radius}` : ""}</span>
              </div>
              {p.headline && <p className="mt-2 text-sm leading-snug opacity-95">{p.headline}</p>}
            </div>
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-2">
            {p.mood && (
              <div className="rounded-2xl bg-white/15 backdrop-blur p-2.5">
                <div className="text-[10px] uppercase tracking-wide opacity-80">Humor de hoje</div>
                <div className="text-sm font-semibold mt-0.5">{p.mood.emoji} {p.mood.text}</div>
              </div>
            )}
            {p.nowPlaying && (
              <div className="rounded-2xl bg-white/15 backdrop-blur p-2.5">
                <div className="text-[10px] uppercase tracking-wide opacity-80 flex items-center gap-1">
                  <NowPlayingIcon kind={p.nowPlaying.kind} /> Curtindo agora
                </div>
                <div className="text-sm font-semibold mt-0.5 truncate">{p.nowPlaying.title}</div>
                {p.nowPlaying.subtitle && <div className="text-[11px] opacity-80 truncate">{p.nowPlaying.subtitle}</div>}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Terreno em comum */}
      {(cg.sharedInterests.length + cg.sharedVibe.length + cg.sharedPlaces.length > 0) && (
        <motion.section
          initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
          className="mx-4 mt-3 rounded-3xl border border-primary/20 bg-accent/60 p-4"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-display font-bold text-sm text-primary">Terreno em comum</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vocês compartilham{" "}
            {[
              cg.sharedInterests.length && `${cg.sharedInterests.length} interesse${cg.sharedInterests.length > 1 ? "s" : ""}`,
              cg.sharedVibe.length && `${cg.sharedVibe.length} vibe${cg.sharedVibe.length > 1 ? "s" : ""}`,
              cg.sharedPlaces.length && `${cg.sharedPlaces.length} lugar${cg.sharedPlaces.length > 1 ? "es" : ""} favorito${cg.sharedPlaces.length > 1 ? "s" : ""}`,
            ].filter(Boolean).join(" · ")}.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cg.sharedInterests.map((t) => (
              <span key={`i-${t}`} className="rounded-full bg-primary text-white text-[11px] font-semibold px-2.5 py-1">{t}</span>
            ))}
            {cg.sharedVibe.map((t) => (
              <span key={`v-${t}`} className="rounded-full bg-surface text-primary border border-primary/30 text-[11px] font-semibold px-2.5 py-1">{t}</span>
            ))}
            {commonPlaces.map((pl) => pl && (
              <span key={`p-${pl.id}`} className="rounded-full bg-surface text-foreground border border-border text-[11px] font-semibold px-2.5 py-1 inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" /> {pl.name}
              </span>
            ))}
          </div>
        </motion.section>
      )}

      {/* Sobre */}
      {(p.bio || (p.looksFor && p.looksFor.length > 0)) && (
        <section className="mx-4 mt-3 rounded-3xl border border-border bg-surface p-4 shadow-soft">
          <h2 className="font-display font-bold text-sm">Sobre</h2>
          {p.bio && <p className="mt-1 text-sm text-muted-foreground italic">"{p.bio}"</p>}
          {p.looksFor && p.looksFor.length > 0 && (
            <>
              <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Aqui buscando</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {p.looksFor.map((l) => (
                  <span key={l} className="rounded-full bg-secondary text-foreground text-[11px] font-semibold px-2.5 py-1">{l}</span>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Interesses + Vibe tags */}
      {(p.interests.length > 0 || (p.vibeTags && p.vibeTags.length > 0)) && (
        <section className="mx-4 mt-3 rounded-3xl border border-border bg-surface p-4 shadow-soft">
          {p.interests.length > 0 && (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Interesses</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {p.interests.map((t) => (
                  <span key={t} className={`rounded-full text-[11px] font-semibold px-2.5 py-1 ${cg.sharedInterests.includes(t) ? "bg-primary text-white" : "bg-accent text-primary"}`}>
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}
          {p.vibeTags && p.vibeTags.length > 0 && (
            <>
              <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Vibe</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {p.vibeTags.map((t) => (
                  <span key={t} className="rounded-full bg-surface text-foreground border border-border text-[11px] font-semibold px-2.5 py-1">
                    ✦ {t}
                  </span>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Momentos */}
      {p.moments && p.moments.length > 0 && (
        <section className="mx-4 mt-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-bold text-sm">Momentos de {p.name.split(" ")[0]}</h2>
            <span className="text-[11px] text-muted-foreground">{p.moments.length} posts</span>
          </div>
          <ul className="space-y-2.5">
            {p.moments.map((m) => <MomentItem key={m.id} m={m} />)}
          </ul>
        </section>
      )}

      {/* Locais favoritos */}
      {favPlaces.length > 0 && (
        <section className="mt-4">
          <div className="px-4 flex items-center justify-between mb-2">
            <h2 className="font-display font-bold text-sm">Locais favoritos</h2>
            <span className="text-[11px] text-muted-foreground">{favPlaces.length}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {favPlaces.map((pl) => pl && (
              <Link key={pl.id} to="/local/$id" params={{ id: pl.id }}
                    className="shrink-0 w-40 rounded-2xl bg-surface border border-border overflow-hidden shadow-soft">
                <img src={pl.cover} alt={pl.name} className="h-20 w-full object-cover" />
                <div className="p-2">
                  <div className="text-[10px] uppercase font-semibold text-primary">{pl.category}</div>
                  <div className="font-semibold text-xs truncate">{pl.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      {p.stats && (
        <section className="mx-4 mt-4 rounded-3xl border border-border bg-surface p-3 flex items-center justify-around text-center">
          <Stat icon={Users} value={p.stats.connections} label="conexões" />
          <div className="h-8 w-px bg-border" />
          <Stat icon={Handshake} value={p.stats.meetups} label="encontros" />
          <div className="h-8 w-px bg-border" />
          <Stat icon={CalendarCheck} value={p.stats.joinedAt} label="desde" />
        </section>
      )}

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] px-4 pb-4 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
        {from === "solicitacao" ? (
          <div className="flex gap-2">
            <Link to="/solicitacao/$id" params={{ id: p.id }}
                  className="flex-1 h-12 rounded-2xl bg-secondary text-foreground font-semibold flex items-center justify-center">
              Voltar
            </Link>
            <button
              onClick={() => nav({ to: "/chat/$id", params: { id: p.id } })}
              className="flex-1 h-12 rounded-2xl bg-gradient-brand text-white font-semibold shadow-elegant"
            >
              Aceitar conversa
            </button>
          </div>
        ) : (
          <Link to="/solicitacao/$id" params={{ id: p.id }}
                className="block h-12 rounded-2xl bg-gradient-brand text-white font-semibold shadow-elegant flex items-center justify-center">
            Enviar solicitação de chat
          </Link>
        )}
      </div>
    </div>
  );
}

function NowPlayingIcon({ kind }: { kind: "music" | "reading" | "watching" }) {
  if (kind === "music") return <Music className="h-3 w-3" />;
  if (kind === "reading") return <BookOpen className="h-3 w-3" />;
  return <Film className="h-3 w-3" />;
}

function MomentItem({ m }: { m: Moment }) {
  const [liked, setLiked] = useState(false);
  const place = m.placeId ? findPlace(m.placeId) : undefined;
  const likes = m.likes + (liked ? 1 : 0);
  return (
    <li className="rounded-2xl border border-border bg-surface overflow-hidden shadow-soft">
      {m.photo && <img src={m.photo} alt="" className="w-full h-40 object-cover" />}
      <div className="p-3">
        <p className="text-sm text-foreground leading-snug">{m.text}</p>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            {place && (
              <Link to="/local/$id" params={{ id: place.id }} className="inline-flex items-center gap-1 text-primary font-semibold">
                <MapPin className="h-3 w-3" /> {place.name}
              </Link>
            )}
            <span>· {m.createdAgo}</span>
          </div>
          <button
            onClick={() => setLiked((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${liked ? "bg-pink/10 text-pink" : "bg-secondary text-muted-foreground"}`}
            aria-label="Curtir momento"
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} /> {likes}
          </button>
        </div>
      </div>
    </li>
  );
}

function Stat({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <Icon className="h-4 w-4 text-primary" />
      <div className="text-sm font-bold mt-0.5">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

// Suppress unused-import warning for currentUser (used indirectly via commonGround)
void currentUser;
