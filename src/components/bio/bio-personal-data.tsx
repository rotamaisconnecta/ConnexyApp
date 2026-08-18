import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { ProfileRepository } from "@/repositories/profile.repository";
import type { ProfileRow } from "@/types/database/tables";

interface Props {
  profile: ProfileRow;
  userId: string;
  configured: boolean;
  onSaved: (updated: ProfileRow) => void;
}

export function BioPersonalDataSection({ profile, userId, configured, onSaved }: Props) {
  const [name, setName] = useState(profile.name ?? "");
  const [handle, setHandle] = useState(profile.handle ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [age, setAge] = useState(profile.age != null ? String(profile.age) : "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!configured || saving) return;
    setSaving(true);
    try {
      const updated = await ProfileRepository.updateProfile(userId, {
        name: name.trim() || null,
        handle: handle.trim().toLowerCase() || null,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        age: age ? Number(age) : null,
      });
      onSaved(updated);
      toast.success("Dados salvos!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("handle") || msg.includes("duplicate")) {
        toast.error("Este nome de usuario ja esta em uso. Tente outro.");
      } else {
        toast.error(msg || "Erro ao salvar dados.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">Nome</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          maxLength={50}
          className="mt-1 h-11 w-full rounded-xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">@usuario</span>
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value.replace(/\s/g, "").toLowerCase())}
          placeholder="seu-usuario"
          maxLength={30}
          className="mt-1 h-11 w-full rounded-xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">Headline</span>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Ex: Explorador urbano | Amante de cafes"
          maxLength={100}
          className="mt-1 h-11 w-full rounded-xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">
          Bio <span className="text-muted-foreground/60">({bio.length}/160)</span>
        </span>
        <textarea
          value={bio}
          maxLength={160}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Fale sobre voce..."
          className="mt-1 h-24 w-full resize-none rounded-xl bg-secondary px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">Idade</span>
        <input
          type="number"
          min={13}
          max={120}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Sua idade"
          className="mt-1 h-11 w-full rounded-xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-11 rounded-xl bg-gradient-brand text-sm font-semibold text-white shadow-soft disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar dados
      </button>
    </div>
  );
}
