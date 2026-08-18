import { useState } from "react";
import { Music, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProfileRepository } from "@/repositories/profile.repository";
import type { ProfileRow } from "@/types/database/tables";

const MOOD_OPTIONS = [
  { emoji: "😊", label: "Feliz" },
  { emoji: "😎", label: "Descontraido" },
  { emoji: "🤔", label: "Pensativo" },
  { emoji: "😴", label: "Cansado" },
  { emoji: "🥳", label: "Animado" },
  { emoji: "😌", label: "Tranquilo" },
  { emoji: "🔥", label: "Empolgado" },
  { emoji: "💡", label: "Inspirado" },
];

const NOW_PLAYING_OPTIONS = [
  { kind: "music" as const, label: "Musica", icon: "🎵" },
  { kind: "reading" as const, label: "Lendo", icon: "📚" },
  { kind: "watching" as const, label: "Assistindo", icon: "🎬" },
];

type NowPlayingKind = "music" | "reading" | "watching";

interface Props {
  profile: ProfileRow;
  userId: string;
  configured: boolean;
  onSaved: (updated: ProfileRow) => void;
}

export function BioMoodSection({ profile, userId, configured, onSaved }: Props) {
  const [moodEmoji, setMoodEmoji] = useState<string | null>(profile.mood_emoji ?? null);
  const [moodText, setMoodText] = useState(profile.mood_text ?? "");
  const [savingMood, setSavingMood] = useState(false);

  const [nowPlayingKind, setNowPlayingKind] = useState<NowPlayingKind | null>(
    profile.now_playing_kind as NowPlayingKind | null,
  );
  const [nowPlayingTitle, setNowPlayingTitle] = useState(profile.now_playing_title ?? "");
  const [nowPlayingSubtitle, setNowPlayingSubtitle] = useState(profile.now_playing_subtitle ?? "");
  const [savingNowPlaying, setSavingNowPlaying] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);

  const handleSaveMood = async () => {
    if (!configured || savingMood) return;
    setSavingMood(true);
    try {
      const updated = await ProfileRepository.updateProfile(userId, {
        mood_emoji: moodEmoji,
        mood_text: moodText.trim() || null,
      });
      onSaved(updated);
      toast.success("Humor atualizado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar humor.");
    } finally {
      setSavingMood(false);
    }
  };

  const handleClearMood = async () => {
    if (!configured || savingMood) return;
    setSavingMood(true);
    try {
      const updated = await ProfileRepository.updateProfile(userId, {
        mood_emoji: null,
        mood_text: null,
      });
      setMoodEmoji(null);
      setMoodText("");
      onSaved(updated);
      toast.success("Humor limpo!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao limpar humor.");
    } finally {
      setSavingMood(false);
    }
  };

  const handleSaveNowPlaying = async () => {
    if (!configured || savingNowPlaying) return;
    setSavingNowPlaying(true);
    try {
      const updated = await ProfileRepository.updateProfile(userId, {
        now_playing_kind: nowPlayingKind,
        now_playing_title: nowPlayingTitle.trim() || null,
        now_playing_subtitle: nowPlayingSubtitle.trim() || null,
      });
      onSaved(updated);
      toast.success("Momento salvo!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar momento.");
    } finally {
      setSavingNowPlaying(false);
    }
  };

  const handleClearNowPlaying = async () => {
    if (!configured || savingNowPlaying) return;
    setSavingNowPlaying(true);
    try {
      const updated = await ProfileRepository.updateProfile(userId, {
        now_playing_kind: null,
        now_playing_title: null,
        now_playing_subtitle: null,
      });
      setNowPlayingKind(null);
      setNowPlayingTitle("");
      setNowPlayingSubtitle("");
      onSaved(updated);
      toast.success("Momento limpo!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao limpar momento.");
    } finally {
      setSavingNowPlaying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mood */}
      <div>
        <span className="text-xs font-medium text-muted-foreground">Como voce esta?</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.emoji}
              onClick={() => {
                if (moodEmoji === m.emoji) {
                  setMoodEmoji(null);
                  setMoodText("");
                } else {
                  setMoodEmoji(m.emoji);
                  setMoodText(m.label);
                }
              }}
              className={`rounded-full px-3 py-1.5 text-sm border transition ${
                moodEmoji === m.emoji
                  ? "bg-gradient-brand text-white border-transparent"
                  : "bg-surface text-foreground border-border hover:border-primary/40"
              }`}
              aria-pressed={moodEmoji === m.emoji}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {moodEmoji && (
            <button
              onClick={handleSaveMood}
              disabled={savingMood}
              className="flex-1 h-9 rounded-xl bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-1"
            >
              {savingMood ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Salvar humor
            </button>
          )}
          {profile.mood_emoji && (
            <button
              onClick={handleClearMood}
              disabled={savingMood}
              className="h-9 px-3 rounded-xl bg-secondary text-muted-foreground text-xs font-semibold"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Now Playing */}
      <div className="border-t border-border pt-3">
        <button
          onClick={() => setShowNowPlaying(!showNowPlaying)}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
        >
          <Music className="h-3.5 w-3.5" />
          Ouvindo / Assistindo / Lendo
          {showNowPlaying ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {showNowPlaying && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              {NOW_PLAYING_OPTIONS.map((opt) => (
                <button
                  key={opt.kind}
                  onClick={() => setNowPlayingKind(nowPlayingKind === opt.kind ? null : opt.kind)}
                  className={`rounded-full px-2.5 py-1 text-xs border transition ${
                    nowPlayingKind === opt.kind
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-surface text-foreground border-border"
                  }`}
                  aria-pressed={nowPlayingKind === opt.kind}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
            {nowPlayingKind && (
              <>
                <input
                  type="text"
                  value={nowPlayingTitle}
                  onChange={(e) => setNowPlayingTitle(e.target.value)}
                  placeholder={
                    nowPlayingKind === "music"
                      ? "Nome da musica"
                      : nowPlayingKind === "reading"
                        ? "Titulo do livro"
                        : "Titulo do filme/serie"
                  }
                  className="h-10 w-full rounded-xl bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
                <input
                  type="text"
                  value={nowPlayingSubtitle}
                  onChange={(e) => setNowPlayingSubtitle(e.target.value)}
                  placeholder={
                    nowPlayingKind === "music"
                      ? "Artista"
                      : nowPlayingKind === "reading"
                        ? "Autor"
                        : "Plataforma / Genero"
                  }
                  className="h-10 w-full rounded-xl bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNowPlaying}
                    disabled={savingNowPlaying}
                    className="flex-1 h-9 rounded-xl bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    {savingNowPlaying ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Salvar momento
                  </button>
                  {profile.now_playing_kind && (
                    <button
                      onClick={handleClearNowPlaying}
                      disabled={savingNowPlaying}
                      className="h-9 px-3 rounded-xl bg-secondary text-muted-foreground text-xs font-semibold"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
