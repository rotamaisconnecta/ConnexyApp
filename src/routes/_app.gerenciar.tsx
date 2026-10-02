import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link, Outlet, useLocation } from "@tanstack/react-router";
import { BackButton } from "@/components/navigation/back-button";
import { signOut } from "@/lib/auth/sign-out";
import { useAuth } from "@/hooks/use-auth";
import { StatusBar } from "@/components/phone-frame";
import { toast } from "sonner";
import {
  LogOut,
  Store,
  Calendar,
  MapPin,
  Tag,
  Car,
  ArrowRight,
  Plus,
  Building2,
  UserRound,
} from "lucide-react";

import { UserRole, type UserRolesState } from "@/lib/roles/roles-types";
import { getStoredRoles } from "@/lib/roles/roles-storage";
import { getDemoIdentity } from "@/lib/demo/demo-identity";
import {
  CatalogKind,
  catalogEntityLabel,
  listCatalogByKind,
  LOCAL_CATALOG_DISCLAIMER,
  subscribeLocalCatalog,
  type CatalogEntity,
  type CatalogKindValue,
} from "@/lib/catalog/local-catalog";

export const Route = createFileRoute("/_app/gerenciar")({
  head: () => ({ meta: [{ title: "Meu Connexy — Connexy" }] }),
  component: GerenciarLayout,
});

interface Section {
  id: string;
  icon: typeof Store;
  title: string;
  subtitle: string;
  createRoute: string;
  bgColor: string;
  role: UserRole;
}

const SECTIONS: Section[] = [
  {
    id: "negocios",
    icon: Store,
    title: "Meus Negócios",
    subtitle: "Cadastre ou abra a página do seu estabelecimento no catálogo local.",
    createRoute: "/create/place-business",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    role: UserRole.BUSINESS,
  },
  {
    id: "eventos",
    icon: Calendar,
    title: "Meus Eventos",
    subtitle: "Crie um evento ou veja os que você já adicionou neste dispositivo.",
    createRoute: "/create/event",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    role: UserRole.EVENT_CREATOR,
  },
  {
    id: "locais",
    icon: MapPin,
    title: "Meus Locais",
    subtitle: "Adicione um lugar para ele aparecer nas descobertas perto de você.",
    createRoute: "/create/place",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    role: UserRole.PLACE_OWNER,
  },
  {
    id: "ofertas",
    icon: Tag,
    title: "Minhas Promoções",
    subtitle: "Publique uma oferta ligada a um negócio já cadastrado neste dispositivo.",
    createRoute: "/create/offer",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    role: UserRole.BUSINESS,
  },
  {
    id: "corridas",
    icon: Car,
    title: "Mobilidade",
    subtitle: "Ofereça corridas como motorista neste dispositivo.",
    createRoute: "/driver",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    role: UserRole.DRIVER,
  },
];

const roleIcons: Record<UserRole, string> = {
  [UserRole.USER]: "👤",
  [UserRole.BUSINESS]: "🏢",
  [UserRole.DRIVER]: "🚗",
  [UserRole.EVENT_CREATOR]: "📅",
  [UserRole.PLACE_OWNER]: "📍",
  [UserRole.REELS_CREATOR]: "🎬",
};

const SECTION_CATALOG_KIND: Partial<Record<string, CatalogKindValue>> = {
  negocios: CatalogKind.BUSINESS,
  eventos: CatalogKind.EVENT,
  locais: CatalogKind.PLACE,
  ofertas: CatalogKind.OFFER,
};

function catalogSectionSubtitle(sectionId: string, fallback: string): string {
  const kind = SECTION_CATALOG_KIND[sectionId];
  if (!kind) return fallback;
  const count = listCatalogByKind(kind, getDemoIdentity().id).length;
  if (count === 0) return fallback;
  return `${fallback} ${count} no catálogo local.`;
}

function ownedCatalogItems(): CatalogEntity[] {
  const ownerId = getDemoIdentity().id;
  return [
    ...listCatalogByKind(CatalogKind.EVENT, ownerId),
    ...listCatalogByKind(CatalogKind.PLACE, ownerId),
    ...listCatalogByKind(CatalogKind.BUSINESS, ownerId),
    ...listCatalogByKind(CatalogKind.OFFER, ownerId),
  ].sort((a, b) => b.createdAt - a.createdAt);
}

function catalogEntityDescription(entity: CatalogEntity): string {
  return entity.description.trim();
}

function OwnedCatalogLink({ entity }: { entity: CatalogEntity }) {
  const kindLabel =
    entity.kind === CatalogKind.EVENT
      ? "Evento"
      : entity.kind === CatalogKind.PLACE
        ? "Local"
        : entity.kind === CatalogKind.BUSINESS
          ? "Negócio"
          : "Oferta";
  const description = catalogEntityDescription(entity);
  const className =
    "flex items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-accent/40";
  const body = (
    <span className="min-w-0">
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
        {kindLabel}
      </span>
      <span className="mt-0.5 block font-semibold leading-snug">{catalogEntityLabel(entity)}</span>
      {description ? (
        <span className="mt-1.5 line-clamp-4 block text-[13px] leading-snug text-muted-foreground">
          {description}
        </span>
      ) : null}
    </span>
  );
  if (entity.kind === CatalogKind.EVENT) {
    return (
      <Link to="/event/$eventId" params={{ eventId: entity.id }} className={className}>
        {body}
      </Link>
    );
  }
  if (entity.kind === CatalogKind.PLACE) {
    return (
      <Link to="/local/$id" params={{ id: entity.id }} className={className}>
        {body}
      </Link>
    );
  }
  const businessId = entity.kind === CatalogKind.OFFER ? entity.businessId : entity.id;
  return (
    <Link to="/business/$businessId" params={{ businessId }} className={className}>
      {body}
    </Link>
  );
}

function GerenciarLayout() {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const isRoot = location.pathname === "/gerenciar";
  const [rolesState, setRolesState] = useState<UserRolesState>(getStoredRoles);
  const [catalogTick, setCatalogTick] = useState(0);

  useEffect(() => {
    function handleChange() {
      setRolesState(getStoredRoles());
    }
    window.addEventListener("roleChanged", handleChange);
    return () => window.removeEventListener("roleChanged", handleChange);
  }, []);
  useEffect(() => subscribeLocalCatalog(() => setCatalogTick((tick) => tick + 1)), []);

  if (!user) return null;

  if (!isRoot) {
    return (
      <div className="flex-1 flex flex-col pb-24">
        <Outlet />
      </div>
    );
  }

  const hasRole = (role: UserRole) => rolesState.roles.includes(role);
  const activeRoles = rolesState.roles.filter((r) => r !== UserRole.USER);
  void catalogTick;
  const ownedItems = ownedCatalogItems();

  return (
    <div className="flex-1 flex flex-col pb-24">
      <StatusBar />
      <header className="px-4 pt-1 pb-3 flex items-center gap-2">
        <BackButton
          fallbackTo="/home"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <div className="flex-1">
          <h1 className="font-display font-semibold text-lg">Meu Connexy</h1>
          <p className="text-[11px] text-muted-foreground">
            {activeRoles.length > 0
              ? `${activeRoles.length} recurso${activeRoles.length > 1 ? "s" : ""} ativo${activeRoles.length > 1 ? "s" : ""}`
              : "Crie seu primeiro recurso"}
          </p>
        </div>
        <button
          onClick={async () => {
            await signOut();
            toast.success("Você saiu");
            nav({ to: "/auth" });
          }}
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary text-muted-foreground"
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <p className="px-4 mb-3 text-[13px] leading-snug text-muted-foreground">
        {LOCAL_CATALOG_DISCLAIMER}
      </p>

      {/* Active resources summary */}
      {activeRoles.length > 0 && (
        <div className="px-4 mb-3 flex flex-wrap gap-2">
          {activeRoles.map((role) => (
            <span
              key={role}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium"
            >
              <span>{roleIcons[role]}</span>
              <span>
                {role === UserRole.BUSINESS
                  ? "Negócio"
                  : role === UserRole.DRIVER
                    ? "Motorista"
                    : role === UserRole.EVENT_CREATOR
                      ? "Eventos"
                      : role === UserRole.PLACE_OWNER
                        ? "Locais"
                        : role === UserRole.REELS_CREATOR
                          ? "Agora"
                          : role}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="px-4 space-y-3">
        {SECTIONS.map((section) => {
          const active = hasRole(section.role);
          const Icon = section.icon;
          return (
            <Link
              key={section.id}
              to={section.id === "corridas" && !active ? "/profile/roles" : section.createRoute}
              className={`flex items-center gap-3 rounded-2xl border border-border p-4 shadow-soft transition-all active:scale-[0.98] ${active ? "bg-surface" : section.bgColor}`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-floating ${
                  active ? "bg-gradient-brand" : "bg-muted-foreground/30"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{section.title}</div>
                <div className="mt-1 line-clamp-3 text-[13px] leading-snug text-muted-foreground">
                  {section.id === "corridas"
                    ? active
                      ? "Abra o painel de motorista para ficar online e gerenciar corridas."
                      : section.subtitle
                    : catalogSectionSubtitle(section.id, section.subtitle)}
                </div>
              </div>
              {active ? (
                <Building2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </Link>
          );
        })}
      </div>

      {ownedItems.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Catálogo local
          </h2>
          <div className="rounded-2xl border border-border bg-surface divide-y divide-border shadow-soft">
            {ownedItems.map((item) => (
              <OwnedCatalogLink key={item.id} entity={item} />
            ))}
          </div>
        </div>
      )}

      {/* Bio management */}
      <div className="px-4 mt-6">
        <Link
          to="/gerenciar/bio"
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft transition-all active:scale-[0.98]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-floating">
            <UserRound className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">Gerenciar minha bio</div>
            <div className="mt-1 line-clamp-3 text-[13px] leading-snug text-muted-foreground">
              Abra o editor da sua bio para alterar foto, textos, humor e interesses.
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      </div>

      {/* Quick create links */}
      <div className="px-4 mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Criar conteudo
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Foto", icon: "📷", route: "/gerenciar/nova-foto" },
            { label: "Video", icon: "🎥", route: "/gerenciar/novo-video" },
            { label: "Texto", icon: "✍", route: "/gerenciar/novo-texto" },
            { label: "Agora", icon: "▶", route: "/gerenciar/novo-reel" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.route as never}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface border border-border p-3 shadow-soft hover:bg-accent/40 transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-semibold text-muted-foreground">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Organizer analytics (phase 10.7.1) */}
      <div className="px-4 mt-6 mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Análises de presença
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Análises de locais e eventos próprios ainda não estão disponíveis no MVP local.
        </p>
      </div>
    </div>
  );
}
