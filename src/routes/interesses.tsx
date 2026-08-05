import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, type KeyboardEvent } from "react";
import { PhoneFrame, StatusBar } from "@/components/phone-frame";
import { Plus, X } from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { allInterests } from "@/lib/mock-data";

export const Route = createFileRoute("/interesses")({
  head: () => ({ meta: [{ title: "Interesses — Connexy" }] }),
  component: Interests,
});

function Interests() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<string[]>([
    "Viagens",
    "Socializar",
    "Eventos",
    "Música",
  ]);
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const allCustoms = [...allInterests, ...customInterests.filter((c) => !allInterests.includes(c))];

  const toggle = (t: string) =>
    setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  const addCustom = () => {
    const val = inputValue.trim();
    if (!val) return;
    if (!allCustoms.includes(val)) {
      setCustomInterests((prev) => [...prev, val]);
    }
    if (!selected.includes(val)) {
      setSelected((prev) => [...prev, val]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustom();
    }
  };

  return (
    <PhoneFrame>
      <StatusBar />
      <div className="flex items-center justify-between px-5 pt-2 pb-4">
        <BackButton
          fallbackTo="/completar-perfil"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <span className="text-xs text-muted-foreground">Passo 3 de 4</span>
        <span className="w-9" />
      </div>

      <div className="px-6 flex-1 flex flex-col">
        <h1 className="font-display text-2xl font-bold">Quase lá! 😊</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione 3 ou mais interesses para conectarmos você com pessoas afins.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {allCustoms.map((t) => {
            const on = selected.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggle(t)}
                className={`rounded-full px-4 py-2 text-sm font-medium border transition ${
                  on
                    ? "bg-gradient-brand text-white border-transparent shadow-soft"
                    : "bg-surface text-foreground border-border"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Adicionar interesse..."
              className="flex-1 h-11 rounded-xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={addCustom}
              disabled={!inputValue.trim()}
              className="h-11 w-11 grid place-items-center rounded-xl bg-gradient-brand text-white disabled:opacity-50 shrink-0"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {customInterests.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {customInterests.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomInterests((prev) => prev.filter((x) => x !== c));
                      setSelected((prev) => prev.filter((x) => x !== c));
                    }}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto pt-6 pb-6 space-y-3">
          <div className="text-xs text-muted-foreground text-center">
            {selected.length} selecionados
          </div>
          <button
            onClick={() => nav({ to: "/finalizar-perfil" })}
            disabled={selected.length < 3}
            className="w-full rounded-full bg-gradient-brand py-4 text-white font-semibold shadow-elegant disabled:opacity-50"
          >
            Continuar
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
