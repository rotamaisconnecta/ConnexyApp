import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CarFront,
  CheckCircle2,
  CircleHelp,
  Megaphone,
  MessageSquare,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AD_METRICS_STORAGE_KEY, readAdMetrics, type AdMetricEvent } from "@/lib/ads/ad-metrics";
import { getPlatformAdminAccess } from "@/lib/admin/admin-access";
import { buildAdminAdOverview } from "@/lib/admin/admin-overview";
import { loadSplashConfig } from "@/lib/splash/splash-store";
import type { SplashConfig } from "@/lib/splash/splash-config";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const access = await getPlatformAdminAccess();
    if (!access.authorized) throw redirect({ to: "/home", replace: true });
    return { accessMode: access.mode };
  },
  head: () => ({ meta: [{ title: "Centro de comando — Connexy" }] }),
  component: AdminDashboard,
});

type LocalSnapshot = {
  events: AdMetricEvent[];
  splash: SplashConfig;
};

const MODULES = [
  { title: "Usuários e acessos", icon: Users, status: "Sem diretório global ou atribuição administrativa compartilhada." },
  { title: "Mobilidade", icon: CarFront, status: "Estados de demo por navegador; sem painel operacional global." },
  { title: "Social e conversas", icon: MessageSquare, status: "Dados privados não são agregados; moderação global indisponível." },
  { title: "Conteúdo e descoberta", icon: Activity, status: "Feed e Reels usam fontes mock e persistência local/demo." },
  { title: "Negócios e eventos", icon: Settings2, status: "Cadastro e catálogo locais; sem administração compartilhada." },
  { title: "Monitoramento e auditoria", icon: CircleHelp, status: "Sem trilha administrativa ou telemetria global implementada." },
] as const;

function AdminDashboard() {
  const { accessMode } = Route.useRouteContext();
  const [snapshot, setSnapshot] = useState<LocalSnapshot | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.getItem(AD_METRICS_STORAGE_KEY);
      setSnapshot({ events: readAdMetrics(), splash: loadSplashConfig() });
    } catch {
      setStorageError(true);
    }
  }, []);

  const overview = snapshot ? buildAdminAdOverview(snapshot.events) : null;

  return (
    <main className="min-h-screen bg-[#f6f5fb] text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-white p-6 md:flex">
          <Link to="/home" className="mb-10 flex items-center gap-2 text-sm font-semibold text-primary">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Connexy
          </Link>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Administração</p>
          <nav className="mt-4 space-y-1" aria-label="Navegação administrativa">
            <a href="#overview" className="block rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary">Visão geral</a>
            <a href="#advertising" className="block rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-secondary">Publicidade e métricas</a>
            <a href="#capabilities" className="block rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-secondary">Capacidades da plataforma</a>
            <Link to="/gerenciar/splash" className="block rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-secondary">Splash screen</Link>
          </nav>
          <div className="mt-auto rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            {accessMode === "demo-preview" ? "Prévia local/demo. Dados e ações ficam neste navegador." : "Acesso administrativo verificado pelo servidor."}
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Connexy · Administração</p>
              <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Centro de comando</h1>
              <p className="mt-1 text-sm text-muted-foreground">Visibilidade baseada somente nas fontes disponíveis nesta instalação.</p>
            </div>
            <Link to="/home" className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold">
              <ArrowLeft className="h-4 w-4" /> Aplicativo
            </Link>
          </header>

          {accessMode === "demo-preview" && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <p><strong>Prévia local/demo.</strong> Métricas e configurações abaixo pertencem a este navegador. Isso não representa autorização segura nem dados globais de produção.</p>
            </div>
          )}

          <section id="overview" className="mt-8 scroll-mt-6">
            <SectionTitle icon={Activity} title="Visão geral" subtitle="Sem agregações entre dispositivos ou usuários." />
            {storageError ? (
              <div role="alert" className="mt-4 rounded-2xl border border-destructive/30 bg-white p-5 text-sm text-destructive">Não foi possível ler o armazenamento local deste navegador.</div>
            ) : !overview || !snapshot ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Carregando indicadores">
                {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-white" />)}
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Impressões registradas" value={overview.impressions} detail="Eventos locais retidos (até 2.000)." icon={BarChart3} />
                <MetricCard label="Cliques registrados" value={overview.clicks} detail="Eventos locais retidos (até 2.000)." icon={ArrowUpRight} />
                <MetricCard label="CTR local" value={`${overview.ctrPercent.toFixed(2)}%`} detail="Cliques ÷ impressões; 0% sem impressões." icon={Activity} />
                <MetricCard label="Splash neste dispositivo" value={snapshot.splash.enabled ? "Ativa" : "Desativada"} detail="Configuração local da Fase 18B." icon={CheckCircle2} />
              </div>
            )}
          </section>

          <section id="advertising" className="mt-10 scroll-mt-6">
            <SectionTitle icon={Megaphone} title="Publicidade e métricas" subtitle="Fonte: connexy:demo:ad-metrics:v1 deste navegador; não é relatório global nem financeiro." />
            <p className="mt-2 text-xs text-muted-foreground">
              Período retido: {overview?.period
                ? `${formatMetricDate(overview.period.from)} – ${formatMetricDate(overview.period.to)}`
                : "nenhum evento registrado neste navegador"}. O histórico local mantém no máximo 2.000 eventos.
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-white">
              <div className="grid grid-cols-[minmax(0,1fr)_90px_90px] gap-3 border-b border-border/60 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[minmax(0,1fr)_120px_120px_120px]">
                <span>Posicionamento</span><span className="text-right">Impressões</span><span className="text-right">Cliques</span><span className="hidden text-right sm:block">CTR</span>
              </div>
              {overview?.placements.map((placement) => (
                <div key={placement.id} className="grid grid-cols-[minmax(0,1fr)_90px_90px] gap-3 border-b border-border/40 px-4 py-3 text-sm last:border-0 sm:grid-cols-[minmax(0,1fr)_120px_120px_120px]">
                  <div className="min-w-0"><p className="truncate font-medium">{placement.label}</p><p className="truncate text-[10px] text-muted-foreground">{placement.id}</p></div>
                  <span className="self-center text-right tabular-nums">{placement.impressions}</span>
                  <span className="self-center text-right tabular-nums">{placement.clicks}</span>
                  <span className="hidden self-center text-right tabular-nums sm:block">{getPlacementCtr(placement.impressions, placement.clicks).toFixed(2)}%</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Home Premium ainda não tem eventos instrumentados encontrados nesta auditoria. Zero nesta tabela significa nenhum evento local registrado, não ausência de atividade na plataforma.</p>
          </section>

          <section id="capabilities" className="mt-10 scroll-mt-6 pb-10">
            <SectionTitle icon={Settings2} title="Capacidades da plataforma" subtitle="Matriz inicial fundamentada nas fontes e operações existentes." />
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {MODULES.map(({ title, icon: Icon, status }) => (
                <article key={title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Icon className="h-4 w-4" /></span>
                  <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{status}</p></div>
                  <span className="ml-auto shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">Parcial</span>
                </article>
              ))}
              <article className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white p-4 lg:col-span-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Megaphone className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">Publicidade e splash</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Métricas locais disponíveis para leitura. Inventário patrocinado é mock; impressão/clique ficam no navegador. Splash é configurável localmente e não tem persistência compartilhada.</p></div>
                <Link to="/gerenciar/splash" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">Abrir splash <ArrowUpRight className="h-3.5 w-3.5" /></Link>
              </article>
            </div>
          </section>

          <footer className="border-t border-border/60 py-5 text-xs text-muted-foreground">
            Administração global permanece incompleta. Usuários, mobilidade, conteúdo, social, negócios, notificações, auditoria e saúde dependem de fontes compartilhadas e permissões administrativas de servidor.
          </footer>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-border bg-white/95 p-2 backdrop-blur md:hidden">
        <a href="#overview" className="flex-1 rounded-lg px-2 py-2 text-center text-xs font-medium">Visão geral</a>
        <a href="#advertising" className="flex-1 rounded-lg px-2 py-2 text-center text-xs font-medium">Anúncios</a>
        <a href="#capabilities" className="flex-1 rounded-lg px-2 py-2 text-center text-xs font-medium">Módulos</a>
      </div>
    </main>
  );
}

function getPlacementCtr(impressions: number, clicks: number): number {
  return impressions > 0 ? (clicks / impressions) * 100 : 0;
}

function formatMetricDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof Activity; title: string; subtitle: string }) {
  return <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><div><h2 className="font-display text-lg font-bold">{title}</h2><p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p></div></div>;
}

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof Activity }) {
  return <article className="rounded-2xl border border-border/60 bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><Icon className="h-4 w-4 text-primary" /></div><p className="mt-3 font-display text-2xl font-bold tabular-nums">{value}</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{detail}</p></article>;
}
