import { useState } from "react";
import { Plus, X, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { ProfileRepository } from "@/repositories/profile.repository";
import { allInterests, interestEmoji } from "@/lib/mock-data";
import type { ProfileRow } from "@/types/database/tables";

const VIBE_SUGGESTIONS = [
  "explorador de bairro",
  "cinéfilo",
  "café antes de tudo",
  "vida noturna",
  "natureza",
  "techy",
  "foodie",
  "aventureiro",
  "zen",
  "criativo",
];

const LOOKS_FOR_SUGGESTIONS = [
  "Novos amigos",
  "Parceiro de rolê",
  "Networking",
  "Conversa boa",
  "Grupo de interesse",
  "Mentoria",
  "Colaboracao",
  "Diversao",
];

function normalizeChip(value: string): string {
  return value.trim().toLowerCase();
}

function toggleChip(arr: string[], value: string): string[] {
  const norm = normalizeChip(value);
  if (!norm) return arr;
  const exists = arr.some((a) => normalizeChip(a) === norm);
  if (exists) return arr.filter((a) => normalizeChip(a) !== norm);
  return [...arr, norm];
}

function addChip(arr: string[], value: string): string[] {
  const norm = normalizeChip(value);
  if (!norm) return arr;
  if (arr.some((a) => normalizeChip(a) === norm)) return arr;
  return [...arr, norm];
}

function removeChip(arr: string[], value: string): string[] {
  const norm = normalizeChip(value);
  return arr.filter((a) => normalizeChip(a) !== norm);
}

interface Props {
  profile: ProfileRow;
  userId: string;
  configured: boolean;
  onSaved: (updated: ProfileRow) => void;
}

export function BioInterestsSection({ profile, userId, configured, onSaved }: Props) {
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
  const [customInterest, setCustomInterest] = useState("");
  const [vibeTags, setVibeTags] = useState<string[]>(profile.vibe_tags ?? []);
  const [customVibe, setCustomVibe] = useState("");
  const [looksFor, setLooksFor] = useState<string[]>(profile.looks_for ?? []);
  const [customLooksFor, setCustomLooksFor] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!configured || saving) return;
    setSaving(true);
    try {
      const updated = await ProfileRepository.updateProfile(userId, {
        interests,
        vibe_tags: vibeTags,
        looks_for: looksFor,
      });
      onSaved(updated);
      toast.success("Interesses salvos!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar interesses.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, fn: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fn();
    }
  };

  return (
    <div className="space-y-4">
      {/* Interests */}
      <div>
        <span className="text-xs font-medium text-muted-foreground">Interesses</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {allInterests.map((t) => (
            <button
              key={t}
              onClick={() => setInterests(toggleChip(interests, t))}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                interests.some((i) => normalizeChip(i) === normalizeChip(t))
                  ? "bg-gradient-brand text-white border-transparent"
                  : "bg-surface text-foreground border-border"
              }`}
              aria-pressed={interests.some((i) => normalizeChip(i) === normalizeChip(t))}
            >
              {interestEmoji[t] ?? "•"} {t}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            onKeyDown={(e) =>
              handleKeyDown(e, () => {
                setInterests(addChip(interests, customInterest));
                setCustomInterest("");
              })
            }
            placeholder="Novo interesse..."
            className="flex-1 h-9 rounded-xl bg-secondary px-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={() => {
              setInterests(addChip(interests, customInterest));
              setCustomInterest("");
            }}
            disabled={!customInterest.trim()}
            className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {interests.some(
          (i) => !allInterests.some((a) => normalizeChip(a) === normalizeChip(i)),
        ) && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {interests
              .filter((i) => !allInterests.some((a) => normalizeChip(a) === normalizeChip(i)))
              .map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-primary"
                >
                  {c}
                  <button
                    onClick={() => setInterests(removeChip(interests, c))}
                    className="hover:text-destructive"
                    aria-label={`Remover ${c}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Vibe Tags */}
      <div className="border-t border-border pt-3">
        <span className="text-xs font-medium text-muted-foreground">Vibe</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {VIBE_SUGGESTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setVibeTags(toggleChip(vibeTags, t))}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                vibeTags.some((v) => normalizeChip(v) === normalizeChip(t))
                  ? "bg-surface text-foreground border-primary/40 bg-primary/5"
                  : "bg-surface text-foreground border-border"
              }`}
              aria-pressed={vibeTags.some((v) => normalizeChip(v) === normalizeChip(t))}
            >
              ✦ {t}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={customVibe}
            onChange={(e) => setCustomVibe(e.target.value)}
            onKeyDown={(e) =>
              handleKeyDown(e, () => {
                setVibeTags(addChip(vibeTags, customVibe));
                setCustomVibe("");
              })
            }
            placeholder="Nova vibe..."
            className="flex-1 h-9 rounded-xl bg-secondary px-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={() => {
              setVibeTags(addChip(vibeTags, customVibe));
              setCustomVibe("");
            }}
            disabled={!customVibe.trim()}
            className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Looks For */}
      <div className="border-t border-border pt-3">
        <span className="text-xs font-medium text-muted-foreground">Procurando por</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {LOOKS_FOR_SUGGESTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setLooksFor(toggleChip(looksFor, t))}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                looksFor.some((l) => normalizeChip(l) === normalizeChip(t))
                  ? "bg-accent text-primary border-primary/30"
                  : "bg-surface text-foreground border-border"
              }`}
              aria-pressed={looksFor.some((l) => normalizeChip(l) === normalizeChip(t))}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={customLooksFor}
            onChange={(e) => setCustomLooksFor(e.target.value)}
            onKeyDown={(e) =>
              handleKeyDown(e, () => {
                setLooksFor(addChip(looksFor, customLooksFor));
                setCustomLooksFor("");
              })
            }
            placeholder="Novo item..."
            className="flex-1 h-9 rounded-xl bg-secondary px-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={() => {
              setLooksFor(addChip(looksFor, customLooksFor));
              setCustomLooksFor("");
            }}
            disabled={!customLooksFor.trim()}
            className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-11 rounded-xl bg-gradient-brand text-sm font-semibold text-white shadow-soft disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar interesses
      </button>
    </div>
  );
}
