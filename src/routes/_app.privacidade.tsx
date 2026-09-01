import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import {
  Shield,
  Bell,
  CreditCard,
  Globe,
  HelpCircle,
  ChevronRight,
  EyeOff,
  Circle,
} from "lucide-react";
import { usePresenceContext } from "@/providers/presence/presence-context";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoMode } from "@/lib/demo/demo-config";

export const Route = createFileRoute("/_app/privacidade")({
  head: () => ({ meta: [{ title: "Privacidade e modo invisível — Connexy" }] }),
  component: Privacy,
});

const STATUS_OPTIONS = [
  {
    value: "online" as const,
    label: "Online",
    description: "Visível para conexões. Aparece como ativo.",
  },
  {
    value: "available" as const,
    label: "Disponível",
    description: "Visível mas marcado como disponível para conversar.",
  },
  {
    value: "dnd" as const,
    label: "Não perturbe",
    description: "Visível mas com modo de não perturbar.",
  },
  {
    value: "invisible" as const,
    label: "Invisível",
    description: "Removido da tabela de presença. Ninguém vê seu status.",
  },
] as const;

function Privacy() {
  const { preference, goOnline, goAvailable, goDnd, goInvisible } = usePresenceContext();
  const configured = isPublicSupabaseConfigured();
  const demo = isDemoMode();

  function handleStatusChange(status: "online" | "available" | "dnd" | "invisible") {
    if (!configured && !demo) return;
    switch (status) {
      case "online":
        goOnline();
        break;
      case "available":
        goAvailable();
        break;
      case "dnd":
        goDnd();
        break;
      case "invisible":
        goInvisible();
        break;
    }
  }

  return (
    <div className="flex-1">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <BackButton
          fallbackTo="/perfil"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
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
              <button
                onClick={() =>
                  handleStatusChange(preference === "invisible" ? "online" : "invisible")
                }
                className={`h-6 w-11 rounded-full ${
                  preference === "invisible" ? "bg-primary" : "bg-border"
                } relative transition`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                    preference === "invisible" ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Quando ativado, você não aparecerá no mapa e outras pessoas não poderão te ver.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Status de presença
          </div>
          <div className="mt-2 space-y-1">
            {STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-center justify-between py-2 text-sm cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{option.label}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{option.description}</p>
                </div>
                <input
                  type="radio"
                  name="presence-status"
                  checked={preference === option.value}
                  onChange={() => handleStatusChange(option.value)}
                  className="h-4 w-4 accent-[color:var(--primary)] ml-3"
                />
              </label>
            ))}
          </div>
        </div>
        {!configured && !demo && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Conecte ao Supabase para ativar o controle de presença.
          </p>
        )}
        {demo && (
          <p className="mt-3 text-[11px] text-primary">
            Modo demo: o status é refletido localmente na interface.
          </p>
        )}
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
            <p className="text-[11px] text-muted-foreground">
              Compartilhe viagens, botão de emergência e central de segurança.
            </p>
          </div>
        </div>
      </section>

      <div className="h-6" />
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
}) {
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
