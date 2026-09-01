import { createFileRoute, useNavigate, type ToOptions } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/phone-frame";
import { isDemoMode } from "@/lib/demo/demo-config";
import { resetDemoData } from "@/lib/demo/demo-db";
import { toast } from "sonner";
import { RotateCcw, MapPin, Users, EyeOff, Home } from "lucide-react";

/*
 * DEV-only demo panel. Rendered at /__dev/demo.
 *
 * In production `isDemoMode()` is statically false, so accessing this route
 * redirects to the home feed and never exposes demo controls or data.
 */

export const Route = createFileRoute("/__dev/demo")({
  head: () => ({ meta: [{ title: "Modo demonstração — Connexy" }] }),
  component: DemoPanel,
});

type DemoLink = { label: string; to: string; desc?: string };

const ROUTES: { group: string; items: DemoLink[] }[] = [
  {
    group: "Entrada",
    items: [
      { label: "/auth", to: "/auth", desc: "Entrar / criar conta" },
      { label: "/home", to: "/home", desc: "Home / feed" },
      { label: "/discover", to: "/discover", desc: "Mapa / descobrir" },
      { label: "/create", to: "/create", desc: "Criar conteúdo" },
      { label: "/profile", to: "/profile", desc: "Meu perfil" },
    ],
  },
  {
    group: "Rolê & mobilidade",
    items: [
      { label: "/destino", to: "/destino", desc: "Definir destino" },
      { label: "/matching", to: "/matching", desc: "Motoristas próximos" },
      { label: "/corrida", to: "/corrida", desc: "Corrida ativa" },
      { label: "/rota", to: "/rota", desc: "Rota no mapa" },
      { label: "/avaliar", to: "/avaliar", desc: "Avaliar corrida" },
    ],
  },
  {
    group: "Pessoas & conexões",
    items: [
      { label: "/connecta", to: "/connecta", desc: "Pessoas próximas" },
      { label: "/pessoas", to: "/pessoas", desc: "Lista de pessoas" },
      { label: "/perfil/beatriz", to: "/perfil/beatriz", desc: "Perfil de outra pessoa" },
      { label: "/chat", to: "/chat", desc: "Lista de conversas" },
      { label: "/chat/beatriz", to: "/chat/beatriz", desc: "Conversa direta" },
    ],
  },
  {
    group: "Presença & notificações",
    items: [
      {
        label: "/privacidade",
        to: "/privacidade",
        desc: "Presença: online/disponível/não perturbe/invisível",
      },
      { label: "/notificacoes", to: "/notificacoes", desc: "Notificações (PT)" },
      { label: "/notifications", to: "/notifications", desc: "Central de notificações" },
    ],
  },
  {
    group: "Locais, eventos & mais",
    items: [
      { label: "/locais", to: "/locais", desc: "Locais próximos" },
      { label: "/events", to: "/events", desc: "Eventos" },
      { label: "/marketplace", to: "/marketplace", desc: "Marketplace" },
      { label: "/feed", to: "/feed", desc: "Feed inteligente" },
      { label: "/trending", to: "/trending", desc: "Em alta" },
      { label: "/recommendations", to: "/recommendations", desc: "Recomendações" },
      { label: "/reels", to: "/reels", desc: "Reels" },
      { label: "/my-connexy", to: "/my-connexy", desc: "Meu Connexy" },
      { label: "/gerenciar", to: "/gerenciar", desc: "Gerenciar" },
      { label: "/engine", to: "/engine", desc: "Motor de recomendação" },
      { label: "/driver", to: "/driver", desc: "Painel do motorista" },
      { label: "/ride/request", to: "/ride/request", desc: "Pedir carona" },
    ],
  },
];

const SCENARIOS: DemoLink[] = [
  { label: "Criar conta / entrar", to: "/auth", desc: "Começar a demonstração" },
  { label: "Ver pessoas próximas (até 2 km)", to: "/connecta", desc: "Pessoas em 'Perto de você'" },
  {
    label: "Convidar para conversar",
    to: "/solicitacao/beatriz?mode=send",
    desc: "Enviar convite (local)",
  },
  {
    label: "Aceitar convite",
    to: "/solicitacao/juliana?mode=receive",
    desc: "Aceitar e criar conversa (local)",
  },
  { label: "Conversar de verdade", to: "/chat/beatriz", desc: "Mensagens locais funcionais" },
  { label: "Modo invisível", to: "/privacidade", desc: "Alternar status de presença" },
];

function DemoLinkCard({ link, onNavigate }: { link: DemoLink; onNavigate: (to: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(link.to)}
      className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-left hover:bg-accent/50 transition-colors"
    >
      <span className="font-mono text-xs text-primary">{link.label}</span>
      {link.desc && (
        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{link.desc}</span>
      )}
    </button>
  );
}

function DemoPanel() {
  const nav = useNavigate();

  if (!isDemoMode()) {
    return (
      <PhoneFrame>
        <div className="flex-1 grid place-items-center px-6 text-center">
          <div>
            <p className="text-sm text-muted-foreground">
              Esta tela só está disponível no modo demonstração local.
            </p>
            <button
              type="button"
              onClick={() => nav({ to: "/home" })}
              className="mt-4 rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-white"
            >
              Ir para a Home
            </button>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  function go(path: string) {
    nav({ href: path } as ToOptions);
  }

  function resetDemo() {
    resetDemoData();
    toast.success("Dados de demonstração reiniciados.");
  }

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        <header className="px-5 pt-1 pb-3 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
              <EyeOff className="h-3 w-3" /> MODO DEMONSTRAÇÃO LOCAL
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold">Painel de demonstração</h1>
            <p className="text-xs text-muted-foreground">
              Sem Supabase · dados 100% locais · somente em desenvolvimento
            </p>
          </div>
          <button
            type="button"
            onClick={() => nav({ to: "/home" })}
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground"
            aria-label="Ir para a Home"
          >
            <Home className="h-4 w-4" />
          </button>
        </header>

        <section className="px-5">
          <button
            type="button"
            onClick={resetDemo}
            className="flex w-full items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Reiniciar dados de demonstração
          </button>
        </section>

        <section className="mt-5 px-5">
          <div className="mb-2 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Cenários principais</h2>
          </div>
          <div className="space-y-2">
            {SCENARIOS.map((s) => (
              <DemoLinkCard key={s.label} link={s} onNavigate={go} />
            ))}
          </div>
        </section>

        {ROUTES.map((group) => (
          <section key={group.group} className="mt-5 px-5">
            <div className="mb-2 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">{group.group}</h2>
            </div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <DemoLinkCard key={item.label} link={item} onNavigate={go} />
              ))}
            </div>
          </section>
        ))}

        <section className="mt-6 px-5">
          <div className="rounded-2xl bg-accent/40 border border-primary/20 p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">Dicas de teste</div>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Entre em /auth e use qualquer e-mail/senha.</li>
              <li>• Convide alguém em /connecta para enviar um convite.</li>
              <li>• Aceite um convite em /solicitacao/:id?mode=receive.</li>
              <li>• A presença muda em /privacidade (invisível reflete na hora).</li>
            </ul>
          </div>
        </section>
      </div>
    </PhoneFrame>
  );
}
