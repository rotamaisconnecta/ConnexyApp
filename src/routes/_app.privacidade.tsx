import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { ChevronLeft, Shield, Bell, CreditCard, Globe, HelpCircle, ChevronRight, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "rmc:invisible";

export const Route = createFileRoute("/_app/privacidade")({
  head: () => ({ meta: [{ title: "Privacidade e modo invisível — RotaMais" }] }),
  component: Privacy,
});

function Privacy() {
  const [invisible, setInvisible] = useState(false);
  const [visibility, setVisibility] = useState<"todos" | "conexoes" | "ninguem">("todos");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setInvisible(localStorage.getItem(KEY) === "1");
  }, []);

  const toggle = () => {
    setInvisible((v) => {
      const next = !v;
      if (typeof window !== "undefined") localStorage.setItem(KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex-1">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <Link to="/perfil" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display font-bold text-lg">Preferências</h1>
      </header>

      <section className="mx-5 rounded-2xl bg-surface border border-border p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-accent text-primary">
            <EyeOff className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Modo invisível</div>
              <button onClick={toggle}
                      className={`h-6 w-11 rounded-full ${invisible ? "bg-primary" : "bg-border"} relative transition`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${invisible ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Quando ativado, você não aparecerá no mapa e outras pessoas não poderão te ver.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quem pode me ver</div>
          <div className="mt-2 space-y-1">
            {[
              { id: "todos", label: "Todos" },
              { id: "conexoes", label: "Apenas conexões" },
              { id: "ninguem", label: "Ninguém" },
            ].map((o) => (
              <label key={o.id} className="flex items-center justify-between py-2 text-sm">
                <span>{o.label}</span>
                <input type="radio" name="vis" checked={visibility === o.id} onChange={() => setVisibility(o.id as typeof visibility)}
                       className="h-4 w-4 accent-[color:var(--primary)]" />
              </label>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Isso não afeta suas corridas e funcionalidades do app.
        </p>
      </section>

      <section className="mt-5 mx-5 rounded-2xl bg-surface border border-border divide-y divide-border">
        <Item icon={Shield} label="Privacidade" hint="Controle sua visibilidade" />
        <Item icon={Bell} label="Notificações" hint="Escolha o que receber" />
        <Item icon={Shield} label="Segurança" hint="Configurações de segurança" />
        <Item icon={CreditCard} label="Pagamentos" hint="Métodos e histórico" />
        <Item icon={Globe} label="Idioma" hint="Português" />
        <Item icon={HelpCircle} label="Ajuda" hint="Central de ajuda e suporte" />
      </section>

      <section className="mt-5 mx-5 rounded-2xl bg-accent/40 border border-primary/20 p-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-semibold">Sua segurança é nossa prioridade</div>
            <p className="text-[11px] text-muted-foreground">Compartilhe viagens, botão de emergência e central de segurança.</p>
          </div>
        </div>
      </section>

      <div className="h-6" />
    </div>
  );
}

function Item({ icon: Icon, label, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="h-9 w-9 grid place-items-center rounded-xl bg-accent text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
