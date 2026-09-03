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
  ChevronRight,
  CircleHelp,
  LockKeyhole,
  LogOut,
  MoreVertical,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  WalletCards,
} from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Configurações — Connexy" }] }),
  component: ProfilePage,
});

const SETTINGS = [
  {
    icon: UserRound,
    title: "Conta e perfil",
    description: "Nome, foto e informações públicas",
    to: "/gerenciar",
  },
  {
    icon: ShieldCheck,
    title: "Privacidade",
    description: "Quem pode ver sua atividade",
    to: "/privacidade",
  },
  {
    icon: Bell,
    title: "Notificações",
    description: "Convites, conversas e novidades",
    to: "/notificacoes",
  },
  {
    icon: LockKeyhole,
    title: "Segurança",
    description: "Acesso e proteção da conta",
    to: "/privacidade",
  },
  {
    icon: WalletCards,
    title: "Pagamentos e corridas",
    description: "Preferências de mobilidade",
    to: "/privacidade",
  },
] as const;

function ProfilePage() {
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
          {SETTINGS.map(({ icon: Icon, title, description, to }, index) => (
            <Link
              key={title}
              to={to}
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
            </Link>
          ))}
        </section>

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

        <section className="rounded-3xl border border-border bg-surface p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-primary">
              <CircleHelp className="h-4.5 w-4.5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Ajuda e suporte</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                Dúvidas, segurança e atendimento
              </span>
            </span>
          </div>
        </section>

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
    </div>
  );
}
