import { createFileRoute, useNavigate, Link, Outlet, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { StatusBar } from "@/components/phone-frame";
import { toast } from "sonner";
import {
  ChevronLeft,
  LogOut,
  Video,
  Image as ImageIcon,
  FileText,
  Calendar,
  Tag,
  MapPin,
  Clapperboard,
} from "lucide-react";

export const Route = createFileRoute("/_app/gerenciar")({
  head: () => ({ meta: [{ title: "Gerenciar — Connexy" }] }),
  component: GerenciarLayout,
});

function GerenciarLayout() {
  const { user } = useAuth();
  const nav = useNavigate();
  const router = useRouter();
  const isRoot = router.state.location.pathname === "/gerenciar";

  if (!user) return null;

  if (!isRoot) {
    return (
      <div className="flex-1 flex flex-col pb-24">
        <Outlet />
      </div>
    );
  }

  const links = [
    { to: "/gerenciar/novo-reel", label: "Novo Reel", icon: Clapperboard },
    { to: "/gerenciar/nova-foto", label: "Nova Foto", icon: ImageIcon },
    { to: "/gerenciar/novo-video", label: "Novo Video", icon: Video },
    { to: "/gerenciar/novo-texto", label: "Novo Texto", icon: FileText },
    { to: "/gerenciar/novo-evento", label: "Novo Evento", icon: Calendar },
    { to: "/gerenciar/nova-oferta", label: "Nova Oferta", icon: Tag },
    { to: "/gerenciar/novo-local", label: "Novo Local", icon: MapPin },
  ];

  return (
    <div className="flex-1 flex flex-col pb-24">
      <StatusBar />
      <header className="px-4 pt-1 pb-3 flex items-center gap-2">
        <Link to="/home" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-lg">Painel Administrativo</h1>
          <p className="text-[11px] text-muted-foreground">Gerencie seu conteudo no Connexy</p>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Você saiu");
            nav({ to: "/auth" });
          }}
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary text-muted-foreground"
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <div className="px-4 mt-4 space-y-2">
        <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider">
          Criar conteudo
        </h2>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-3 rounded-2xl bg-surface border border-border p-4 shadow-soft hover:bg-accent/40 transition-colors"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-white">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold">{link.label}</div>
                <div className="text-[11px] text-muted-foreground">Criar e publicar</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
