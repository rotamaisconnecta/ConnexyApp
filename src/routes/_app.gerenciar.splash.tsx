import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Save, ShieldAlert } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { Switch } from "@/components/ui/switch";
import { useDemoIdentity } from "@/lib/demo/demo-identity";
import { getStoredRoles } from "@/lib/roles/roles-storage";
import { canManageSplash } from "@/lib/splash/splash-permissions";
import { getPlatformAdminAccess } from "@/lib/admin/admin-access";
import {
  loadSplashConfig,
  resetSplashConfig,
  saveSplashConfig,
} from "@/lib/splash/splash-store";
import { splashDailyCount } from "@/lib/splash/splash-frequency";
import type { SplashConfig, SplashType } from "@/lib/splash/splash-config";
import {
  CatalogField,
  CatalogSection,
  catalogInputClass,
  catalogAreaClass,
} from "@/components/catalog/catalog-form-ui";

export const Route = createFileRoute("/_app/gerenciar/splash")({
  beforeLoad: async () => ({
    isGlobalAdmin: (await getPlatformAdminAccess()).authorized,
  }),
  head: () => ({ meta: [{ title: "Splash screen — Connexy" }] }),
  component: GerenciarSplash,
});

const TYPE_LABELS: Record<SplashType, string> = {
  institutional: "Institucional",
  promotional: "Promocional",
  sponsored: "Patrocinada",
};

const TYPE_OPTIONS: SplashType[] = ["institutional", "promotional", "sponsored"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toLocalInputValue(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function fromLocalInputValue(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function validateSplash(config: SplashConfig): string[] {
  const errors: string[] = [];
  if (config.startAt && config.endAt) {
    const start = Date.parse(config.startAt);
    const end = Date.parse(config.endAt);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
      errors.push("O fim do período deve ser depois do início.");
    }
  }
  return errors;
}

function GerenciarSplash() {
  const { isGlobalAdmin } = Route.useRouteContext();
  const identity = useDemoIdentity();
  const [rolesState, setRolesState] = useState(() => getStoredRoles());
  const [config, setConfig] = useState<SplashConfig>(() => loadSplashConfig());
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    function handleChange() {
      setRolesState(getStoredRoles());
    }
    window.addEventListener("roleChanged", handleChange);
    return () => window.removeEventListener("roleChanged", handleChange);
  }, []);

  const authorized = isGlobalAdmin || canManageSplash(rolesState.roles);

  const hasCurrentSplashPermission = async () => {
    const currentRoles = getStoredRoles();
    const adminAccess = await getPlatformAdminAccess();
    setRolesState(currentRoles);
    return adminAccess.authorized || canManageSplash(currentRoles.roles);
  };
  const countToday = useMemo(() => splashDailyCount(identity.id), [identity.id]);

  const update = (patch: Partial<SplashConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
    setErrors([]);
  };

  const updatePeriod = (startAt?: string, endAt?: string) => {
    setConfig((current) => ({ ...current, startAt, endAt }));
    setErrors([]);
  };

  const handleSave = async () => {
    if (!(await hasCurrentSplashPermission())) {
      setErrors(["A autorização expirou. Atualize a página e tente novamente."]);
      return;
    }
    const validation = validateSplash(config);
    if (validation.length > 0) {
      setErrors(validation);
      return;
    }
    saveSplashConfig(config);
    toast.success("Splash screen atualizada neste dispositivo.");
  };

  const handleReset = async () => {
    if (!(await hasCurrentSplashPermission())) {
      setErrors(["A autorização expirou. Atualize a página e tente novamente."]);
      return;
    }
    resetSplashConfig();
    setConfig(loadSplashConfig());
    setErrors([]);
    toast.success("Configuração padrão restaurada.");
  };

  if (!authorized) {
    return (
      <div className="flex-1 flex flex-col pb-24 overflow-y-auto no-scrollbar">
        <StatusBar />
        <header className="px-4 pt-1 pb-3 flex items-center gap-2">
          <BackButton
            fallbackTo="/home"
            className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
          />
          <h1 className="flex-1 font-display font-bold text-lg">Splash screen</h1>
        </header>
        <div className="px-4 mt-6 flex flex-col items-center gap-3 rounded-3xl border border-border/60 bg-surface p-6 text-center shadow-soft">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
          </span>
          <h2 className="font-display text-sm font-bold">Sem permissão para campanhas</h2>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            A gestão da splash exige o papel Negócio. Ative o papel em seus modos e tente de novo.
          </p>
          <Link
            to="/profile/roles"
            className="inline-flex h-11 items-center rounded-full bg-gradient-brand px-5 text-sm font-semibold text-white shadow-soft transition-opacity hover:opacity-90"
          >
            Ativar papel Negócio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-24 overflow-y-auto no-scrollbar">
      <StatusBar />
      <header className="px-4 pt-1 pb-3 flex items-center gap-2">
        <BackButton
          fallbackTo="/home"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <h1 className="flex-1 font-display font-bold text-lg">Splash screen</h1>
      </header>

      {/* Estado atual */}
      <div className="px-4">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-soft">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Estado atual
            </p>
            <p className="mt-1 text-sm font-semibold">
              {config.enabled ? `Ativa (${TYPE_LABELS[config.type ?? "institutional"]})` : "Desativada"}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {config.startAt || config.endAt
                ? `Período: ${config.startAt ? "com início" : "sem início"} · ${
                    config.endAt ? "com fim" : "sem fim"
                  }`
                : "Sem período (sempre ativa enquanto habilitada)"}
            </p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold">
            {countToday}/3 exibições hoje
          </span>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <CatalogSection title="Ativação" hint="Habilite ou desative a exibição da splash neste dispositivo.">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Splash ativa</p>
              <p className="text-[11px] text-muted-foreground">Até três exibições por dia, horário de Brasília.</p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => update({ enabled })}
              aria-label="Splash ativa"
            />
          </div>
        </CatalogSection>

        <CatalogSection title="Conteúdo" hint="A imagem e os textos aparecem na tela de abertura.">
          <div className="space-y-3">
            <CatalogField label="Tipo">
              <select
                className={catalogInputClass}
                value={config.type ?? "institutional"}
                onChange={(event) => update({ type: event.target.value as SplashType })}
              >
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </CatalogField>
            <CatalogField label="Imagem (URL ou caminho local)">
              <input
                className={catalogInputClass}
                value={config.image ?? ""}
                placeholder="https://… ou /assets/…"
                onChange={(event) => update({ image: event.target.value })}
              />
            </CatalogField>
            <CatalogField label="Título">
              <input
                className={catalogInputClass}
                value={config.title ?? ""}
                placeholder="Opcional"
                onChange={(event) => update({ title: event.target.value })}
              />
            </CatalogField>
            <CatalogField label="Subtítulo">
              <textarea
                className={`${catalogAreaClass} min-h-20`}
                value={config.subtitle ?? ""}
                placeholder="Opcional"
                onChange={(event) => update({ subtitle: event.target.value })}
              />
            </CatalogField>
          </div>
        </CatalogSection>

        <CatalogSection title="Período de exibição" hint="Deixe vazio para não restringir por data.">
          <div className="grid grid-cols-2 gap-3">
            <CatalogField label="Início">
              <input
                type="datetime-local"
                className={catalogInputClass}
                value={toLocalInputValue(config.startAt)}
                onChange={(event) => updatePeriod(fromLocalInputValue(event.target.value), config.endAt)}
              />
            </CatalogField>
            <CatalogField label="Fim">
              <input
                type="datetime-local"
                className={catalogInputClass}
                value={toLocalInputValue(config.endAt)}
                onChange={(event) => updatePeriod(config.startAt, fromLocalInputValue(event.target.value))}
              />
            </CatalogField>
          </div>
          <CatalogField label="Prioridade (opcional)">
            <input
              type="number"
              className={catalogInputClass}
              value={config.priority ?? ""}
              placeholder="Ex.: 1"
              onChange={(event) =>
                update({
                  priority:
                    event.target.value === "" ? undefined : Number(event.target.value),
                })
              }
            />
          </CatalogField>
        </CatalogSection>

        {errors.length > 0 && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-brand px-5 text-sm font-semibold text-white shadow-soft transition-transform active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            Salvar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-foreground transition-transform active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar padrão
          </button>
        </div>
      </div>
    </div>
  );
}
