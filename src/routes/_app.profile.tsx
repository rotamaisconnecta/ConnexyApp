import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBar } from "@/components/phone-frame";
import { ConfirmDialog } from "@/components/system/confirm-dialog";
import { signOut } from "@/lib/auth/sign-out";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoMode } from "@/lib/demo/demo-config";
import { exitDemoSession } from "@/lib/demo/demo-auth";
import { toast } from "sonner";
import {
  Bell,
  CarFront,
  ChevronRight,
  CircleHelp,
  Globe2,
  LockKeyhole,
  LogOut,
  MoreVertical,
  ShieldCheck,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Configurações — Connexy" }] }),
  component: ProfilePage,
});

const SETTINGS = [
  {
    icon: ShieldCheck,
    title: "Privacidade",
    description: "Controle sua visibilidade",
    id: "privacy",
  },
  {
    icon: Bell,
    title: "Notificações",
    description: "Escolha o que receber",
    id: "notifications",
  },
  {
    icon: LockKeyhole,
    title: "Segurança",
    description: "Configurações de segurança",
    id: "security",
  },
  {
    icon: WalletCards,
    title: "Pagamentos",
    description: "Métodos e histórico",
    id: "payments",
  },
  {
    icon: Globe2,
    title: "Idioma",
    description: "Português",
    id: "language",
  },
  {
    icon: CircleHelp,
    title: "Ajuda",
    description: "Central de ajuda e suporte",
    id: "help",
  },
] as const;

type SettingId = (typeof SETTINGS)[number]["id"];

function ProfilePage() {
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [activeSetting, setActiveSetting] = useState<SettingId | null>(null);

  async function doSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      if (isDemoMode()) exitDemoSession();
      else if (isPublicSupabaseConfigured()) await signOut();
      toast.success("Você saiu da sua conta.");
      nav({ to: "/auth", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível sair da conta.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex-1 pb-8">
      <StatusBar />
      <header className="flex items-center justify-between px-5 pb-5 pt-1">
        <div>
          <h1 className="font-display text-xl font-bold">Configurações</h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Controle sua conta e suas preferências
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label="Mais opções"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-muted-foreground transition active:scale-95"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Fechar opções"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <Link
                to="/my-connexy"
                onClick={() => setMenuOpen(false)}
                className="absolute right-0 top-full z-50 mt-2 flex w-52 items-center gap-2.5 rounded-2xl border border-border bg-surface px-3 py-3 text-sm font-semibold shadow-elevated"
              >
                <SlidersHorizontal className="h-4 w-4 text-primary" /> Meu Connexy
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="space-y-5 px-4">
        <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-soft">
          {SETTINGS.map(({ icon: Icon, title, description, id }, index) => (
            <button
              key={title}
              type="button"
              onClick={() => setActiveSetting(id)}
              className={`flex items-center gap-3 px-4 py-4 transition-colors hover:bg-accent/40 ${index > 0 ? "border-t border-border" : ""}`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {description}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </section>

        <Link
          to="/driver"
          className="flex items-center gap-3 rounded-3xl border border-primary/20 bg-primary/[0.055] p-4 text-primary shadow-soft transition active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <CarFront className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold">Torne-se um motorista</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              Dirija com o Connexy e ganhe no seu ritmo
            </span>
          </span>
          <ChevronRight className="h-4 w-4" />
        </Link>

        <Link
          to="/my-connexy"
          className="flex items-center gap-3 rounded-3xl bg-gradient-brand p-4 text-white shadow-elegant transition active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/16">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold">Meu Connexy</span>
            <span className="mt-0.5 block text-[11px] text-white/80">
              Estatísticas, atividade e criações
            </span>
          </span>
          <ChevronRight className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={signingOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3.5 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" /> {signingOut ? "Saindo..." : "Sair da conta"}
        </button>
      </main>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doSignOut}
        title="Sair da conta"
        message="Tem certeza de que deseja sair? Você precisará entrar novamente para continuar."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        danger
      />
      <SettingsSheet setting={activeSetting} onClose={() => setActiveSetting(null)} />
    </div>
  );
}

function SettingsSheet({ setting, onClose }: { setting: SettingId | null; onClose: () => void }) {
  const [visibility, setVisibility] = useState("Conexões");
  const [locationVisible, setLocationVisible] = useState(true);
  const [messages, setMessages] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [payment, setPayment] = useState("Cartão final 4821");
  const [language, setLanguage] = useState("Português");
  if (!setting) return null;
  const title = SETTINGS.find((item) => item.id === setting)?.title ?? "Configurações";
  const save = () => {
    toast.success(`${title} atualizado.`);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-[28px] bg-background p-5 shadow-elevated">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-primary">
            Fechar
          </button>
        </div>
        {setting === "privacy" && (
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-semibold">
              Quem pode ver sua atividade
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              >
                <option>Todos</option>
                <option>Conexões</option>
                <option>Somente você</option>
              </select>
            </label>
            <Toggle
              label="Mostrar localização aproximada"
              value={locationVisible}
              onChange={setLocationVisible}
            />
          </div>
        )}
        {setting === "notifications" && (
          <div className="mt-5 space-y-3">
            <Toggle label="Convites e conversas" value={messages} onChange={setMessages} />
            <Toggle
              label="Promoções e novidades perto de você"
              value={promotions}
              onChange={setPromotions}
            />
          </div>
        )}
        {setting === "security" && (
          <div className="mt-5 space-y-3">
            <Toggle label="Verificação em duas etapas" value={twoFactor} onChange={setTwoFactor} />
            <button
              type="button"
              onClick={() => toast.success("Link para alteração de senha preparado.")}
              className="w-full rounded-xl bg-secondary px-3 py-3 text-left text-sm font-semibold"
            >
              Alterar senha
            </button>
          </div>
        )}
        {setting === "payments" && (
          <div className="mt-5 space-y-3">
            <label className="block text-sm font-semibold">
              Método padrão
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              >
                <option>Cartão final 4821</option>
                <option>Pix</option>
                <option>Dinheiro</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => toast("Histórico de pagamentos disponível no modo demonstração.")}
              className="w-full rounded-xl bg-secondary px-3 py-3 text-left text-sm font-semibold"
            >
              Ver histórico
            </button>
          </div>
        )}
        {setting === "language" && (
          <div className="mt-5">
            <label className="block text-sm font-semibold">
              Idioma
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              >
                <option>Português</option>
                <option>English</option>
                <option>Español</option>
              </select>
            </label>
          </div>
        )}
        {setting === "help" && (
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => toast("Abrindo perguntas frequentes.")}
              className="w-full rounded-xl bg-secondary px-3 py-3 text-left text-sm font-semibold"
            >
              Perguntas frequentes
            </button>
            <button
              type="button"
              onClick={() => toast.success("Mensagem para o suporte iniciada.")}
              className="w-full rounded-xl bg-secondary px-3 py-3 text-left text-sm font-semibold"
            >
              Falar com o suporte
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={save}
          className="mt-6 h-11 w-full rounded-full bg-gradient-brand text-sm font-bold text-white"
        >
          Salvar alterações
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm font-semibold">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`h-7 w-12 rounded-full p-1 transition ${value ? "bg-primary" : "bg-border"}`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow transition ${value ? "translate-x-5" : ""}`}
        />
      </button>
    </label>
  );
}
