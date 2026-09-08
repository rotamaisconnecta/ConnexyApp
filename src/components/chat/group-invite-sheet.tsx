import { useMemo, useState } from "react";
import { Check, Search, Users, X } from "lucide-react";
import { people } from "@/lib/mock-data";
import { isConnected } from "@/lib/demo/demo-db";

interface GroupInviteSheetProps {
  sourceConversationId: string;
  currentUserId: string;
  sourceName: string;
  onClose: () => void;
  onCreate: (ids: string[], name: string) => void;
}

/** A deliberate confirmation step keeps a direct thread from becoming a group implicitly. */
export function GroupInviteSheet({
  sourceConversationId,
  currentUserId,
  sourceName,
  onClose,
  onCreate,
}: GroupInviteSheetProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [name, setName] = useState(`Grupo com ${sourceName}`);
  const candidates = useMemo(
    () => people.filter((person) => person.id !== currentUserId && isConnected(person.id)),
    [currentUserId],
  );
  const filtered = candidates.filter((person) =>
    person.name.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR")),
  );

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-black/35 p-3 backdrop-blur-[1px] sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Convidar para grupo"
    >
      <div className="w-full max-w-md rounded-[28px] bg-surface p-5 shadow-elevated">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Convidar para grupo</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              A conversa privada com {sourceName} continuará separada.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {confirming ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-primary/8 p-3 text-sm">
              <Users className="mb-2 h-5 w-5 text-primary" />
              Um novo grupo será criado. O histórico desta conversa privada não será copiado.
            </div>
            <label className="block text-xs font-semibold">
              Nome do grupo
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <div className="text-xs text-muted-foreground">
              Convites pendentes:{" "}
              {selected
                .map((id) => people.find((person) => person.id === id)?.name)
                .filter(Boolean)
                .join(", ")}
              .
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="h-11 flex-1 rounded-full border border-border text-sm font-semibold"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => onCreate(selected, name)}
                className="h-11 flex-1 rounded-full bg-gradient-brand text-sm font-semibold text-white"
              >
                Criar grupo
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar conexões"
                className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {candidates.length === 0 ? (
              <div className="py-10 text-center">
                <Users className="mx-auto h-7 w-7 text-primary" />
                <p className="mt-3 text-sm font-semibold">Nenhuma conexão disponível</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Conecte-se com pessoas antes de convidá-las para um grupo.
                </p>
              </div>
            ) : (
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {filtered.map((person) => {
                  const selectedPerson = selected.includes(person.id);
                  return (
                    <li key={person.id}>
                      <button
                        type="button"
                        onClick={() => toggle(person.id)}
                        aria-pressed={selectedPerson}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left ${selectedPerson ? "border-primary/50 bg-primary/5" : "border-border"}`}
                      >
                        <img
                          src={person.photo}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{person.name}</span>
                          <span className="text-[11px] text-muted-foreground">
                            Conectado{person.online ? " · online" : ""}
                          </span>
                        </span>
                        <span
                          className={`grid h-6 w-6 place-items-center rounded-full border ${selectedPerson ? "border-primary bg-primary text-white" : "border-border"}`}
                        >
                          {selectedPerson && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {candidates.length > 0 && (
              <button
                type="button"
                disabled={selected.length === 0}
                onClick={() => setConfirming(true)}
                className="mt-5 h-11 w-full rounded-full bg-gradient-brand text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                Continuar ({selected.length})
              </button>
            )}
          </>
        )}
        <input type="hidden" value={sourceConversationId} readOnly />
      </div>
    </div>
  );
}
