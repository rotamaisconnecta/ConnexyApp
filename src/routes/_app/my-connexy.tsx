import { useState, useEffect, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Calendar,
  MapPin,
  Tag,
  Car,
  Plus,
  ChevronRight,
  Eye,
  Heart,
  MapPinned,
  MessageSquare,
  Users,
  Star,
  Clock,
  Image,
  BarChart3,
  Settings,
  Trash2,
  PauseCircle,
  Copy,
  X,
  type LucideIcon,
} from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { Colors, Radius, Shadows } from "@/theme";
import { UserRole, type UserRolesState } from "@/lib/roles/roles-types";
import { getStoredRoles } from "@/lib/roles/roles-storage";
import { currentUser } from "@/lib/mock-data";
import WizardBase from "@/components/my-connexy/wizard-base";
import type { WizardStep } from "@/components/my-connexy/wizard-base";

export const Route = createFileRoute("/_app/my-connexy")({
  head: () => ({ meta: [{ title: "Meu Connexy — Central" }] }),
  component: MyConnexyPage,
});

/* ─── Types ──────────────────────────────────────────── */

interface ResumoItem {
  id: string;
  label: string;
  icon: LucideIcon;
  emoji: string;
  count: number;
  color: string;
  bgLight: string;
  route: string;
  role: UserRole;
}

interface StatItem {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  change: string;
  positive: boolean;
}

interface ActivityItem {
  id: string;
  type: "post" | "event" | "offer" | "ride";
  text: string;
  time: string;
  icon: string;
}

type WizardType = "negocio" | "evento" | "local" | "oferta" | "publicacao" | null;

/* ─── Data ───────────────────────────────────────────── */

const RESUMO_ITEMS: ResumoItem[] = [
  {
    id: "negocios",
    label: "Negócios",
    icon: Store,
    emoji: "🏢",
    count: 1,
    color: "#F59E0B",
    bgLight: "bg-amber-50 dark:bg-amber-950/20",
    route: "/create/place-business",
    role: UserRole.BUSINESS,
  },
  {
    id: "eventos",
    label: "Eventos",
    icon: Calendar,
    emoji: "📅",
    count: 0,
    color: "#EC4899",
    bgLight: "bg-pink-50 dark:bg-pink-950/20",
    route: "/create/event",
    role: UserRole.EVENT_CREATOR,
  },
  {
    id: "locais",
    label: "Locais",
    icon: MapPin,
    emoji: "📍",
    count: 0,
    color: "#3B82F6",
    bgLight: "bg-blue-50 dark:bg-blue-950/20",
    route: "/create/place",
    role: UserRole.PLACE_OWNER,
  },
  {
    id: "ofertas",
    label: "Promoções",
    icon: Tag,
    emoji: "🏷️",
    count: 0,
    color: "#8B5CF6",
    bgLight: "bg-purple-50 dark:bg-purple-950/20",
    route: "/create/offer",
    role: UserRole.BUSINESS,
  },
  {
    id: "mobilidade",
    label: "Mobilidade",
    icon: Car,
    emoji: "🚗",
    count: 0,
    color: "#22C55E",
    bgLight: "bg-green-50 dark:bg-green-950/20",
    route: "/driver",
    role: UserRole.DRIVER,
  },
];

const STATS: StatItem[] = [
  { id: "views", label: "Visualizações", icon: Eye, value: "2.4k", change: "+12%", positive: true },
  { id: "likes", label: "Curtidas", icon: Heart, value: "847", change: "+8%", positive: true },
  { id: "visits", label: "Visitas", icon: MapPinned, value: "156", change: "+23%", positive: true },
  {
    id: "messages",
    label: "Mensagens",
    icon: MessageSquare,
    value: "43",
    change: "-5%",
    positive: false,
  },
  {
    id: "followers",
    label: "Seguidores",
    icon: Users,
    value: "189",
    change: "+15%",
    positive: true,
  },
  { id: "rating", label: "Avaliação", icon: Star, value: "4.8", change: "+0.2", positive: true },
];

const ACTIVITIES: ActivityItem[] = [
  { id: "a1", type: "post", text: "Nova publicação no feed", time: "há 2 h", icon: "📝" },
  { id: "a2", type: "offer", text: "Promoção de fim de semana criada", time: "há 5 h", icon: "🏷️" },
  {
    id: "a3",
    type: "event",
    text: "Evento atualizado: Sunset no Parque",
    time: "ontem",
    icon: "📅",
  },
  { id: "a4", type: "ride", text: "Corrida finalizada — R$ 24,50", time: "ontem", icon: "🚗" },
  {
    id: "a5",
    type: "post",
    text: "Reel publicado: 2.3k visualizações",
    time: "há 3 d",
    icon: "🎬",
  },
];

/* ─── Wizard Step Creators ────────────────────────────── */

function negocioSteps(): WizardStep[] {
  return [
    {
      id: "nome",
      title: "Qual o nome do seu negócio?",
      content: <FormField label="Nome" placeholder="Ex: Minha Empresa" />,
    },
    {
      id: "categoria",
      title: "Selecione a categoria",
      content: (
        <CategoryPicker
          categories={["Restaurante", "Café", "Loja", "Serviço", "Evento", "Outro"]}
        />
      ),
    },
    {
      id: "endereco",
      title: "Onde fica seu negócio?",
      content: <FormField label="Endereço" placeholder="Rua, número, bairro" />,
    },
    { id: "fotos", title: "Adicione fotos do negócio", content: <PhotoUploader /> },
    {
      id: "horario",
      title: "Horário de funcionamento",
      content: <FormField label="Horário" placeholder="Ex: Seg-Sex 09:00-18:00" />,
    },
    {
      id: "contato",
      title: "Informações de contato",
      content: (
        <div className="space-y-3">
          <FormField label="Telefone" placeholder="(11) 99999-9999" />
          <FormField label="Instagram" placeholder="@seudominio" />
        </div>
      ),
    },
    {
      id: "preview",
      title: "Pré-visualização",
      content: <PreviewCard title="Meu Negócio" subtitle="Restaurante • 200m" />,
    },
  ];
}

function eventSteps(): WizardStep[] {
  return [
    {
      id: "nome",
      title: "Nome do evento",
      content: <FormField label="Nome" placeholder="Ex: Sunset no Parque" />,
    },
    {
      id: "data",
      title: "Data do evento",
      content: <FormField label="Data" placeholder="DD/MM/AAAA" />,
    },
    { id: "hora", title: "Horário", content: <FormField label="Hora" placeholder="HH:MM" /> },
    {
      id: "categoria",
      title: "Categoria do evento",
      content: (
        <CategoryPicker
          categories={["Festa", "Show", "Workshop", "Esporte", "Cultural", "Outro"]}
        />
      ),
    },
    { id: "banner", title: "Banner do evento", content: <PhotoUploader /> },
    {
      id: "descricao",
      title: "Descrição",
      content: <FormField label="Descrição" placeholder="Descreva seu evento..." multiline />,
    },
  ];
}

function localSteps(): WizardStep[] {
  return [
    {
      id: "nome",
      title: "Nome do local",
      content: <FormField label="Nome" placeholder="Ex: Café Central" />,
    },
    {
      id: "categoria",
      title: "Categoria",
      content: (
        <CategoryPicker
          categories={["Restaurante", "Café", "Loja", "Parque", "Cultural", "Outro"]}
        />
      ),
    },
    {
      id: "localizacao",
      title: "Localização",
      content: <FormField label="Endereço" placeholder="Rua, número, bairro" />,
    },
    { id: "fotos", title: "Fotos do local", content: <PhotoUploader /> },
    {
      id: "descricao",
      title: "Descrição",
      content: <FormField label="Descrição" placeholder="Descreva seu local..." multiline />,
    },
  ];
}

function offerSteps(): WizardStep[] {
  return [
    {
      id: "titulo",
      title: "Título da oferta",
      content: <FormField label="Título" placeholder="Ex: 20% OFF em todos os cafés" />,
    },
    { id: "imagem", title: "Imagem da oferta", content: <PhotoUploader /> },
    {
      id: "preco",
      title: "Preço",
      content: <FormField label="Preço" placeholder="R$ 0,00" type="number" />,
    },
    {
      id: "desconto",
      title: "Desconto",
      content: <FormField label="Desconto" placeholder="Ex: 20%" />,
    },
    {
      id: "descricao",
      title: "Descrição",
      content: <FormField label="Descrição" placeholder="Detalhes da oferta..." multiline />,
    },
  ];
}

function publicacaoSteps(): WizardStep[] {
  return [
    {
      id: "tipo",
      title: "O que deseja publicar?",
      content: <CategoryPicker categories={["Texto", "Foto", "Vídeo", "Reel"]} />,
    },
    {
      id: "conteudo",
      title: "Escreva sua publicação",
      content: <FormField label="Conteúdo" placeholder="O que está acontecendo?" multiline />,
    },
    { id: "midia", title: "Adicione mídia", content: <PhotoUploader /> },
  ];
}

/* ─── Sub-components ─────────────────────────────────── */

function FormField({
  label,
  placeholder,
  multiline,
  type,
}: {
  label: string;
  placeholder: string;
  multiline?: boolean;
  type?: string;
}) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <Tag
        type={type ?? "text"}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        style={{ resize: multiline ? "vertical" : "none", minHeight: multiline ? 100 : undefined }}
      />
    </div>
  );
}

function CategoryPicker({ categories }: { categories: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-2 gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setSelected(cat)}
          className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
            selected === cat
              ? "bg-primary text-white shadow-md"
              : "bg-surface border border-border hover:border-primary/30"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

function PhotoUploader() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors"
      style={{ borderColor: Colors.border, background: Colors.surface }}
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 grid place-items-center">
        <Image size={20} className="text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">Toque para adicionar fotos</p>
      <p className="text-[10px] text-muted-foreground">PNG, JPG até 10MB</p>
    </div>
  );
}

function PreviewCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-soft">
      <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 grid place-items-center">
        <Store size={32} className="text-primary/40" />
      </div>
      <div className="p-4">
        <h4 className="font-bold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

/* ─── Management Panels ──────────────────────────────── */

function PanelNegocios({ onClose }: { onClose: () => void }) {
  return (
    <PanelShell
      title="Meus Negócios"
      emoji="🏢"
      gradient="linear-gradient(135deg, #F59E0B, #D97706)"
      onClose={onClose}
    >
      <div className="space-y-3">
        <PanelCard label="Café Central" subtitle="Restaurantes • 200m" stats="1.2k visitas" />
        <div className="flex gap-2 mt-4">
          <PanelAction icon={Settings} label="Editar" />
          <PanelAction icon={BarChart3} label="Estatísticas" />
          <PanelAction icon={Tag} label="Promoções" />
          <PanelAction icon={Trash2} label="Excluir" danger />
        </div>
      </div>
    </PanelShell>
  );
}

function PanelEventos({ onClose }: { onClose: () => void }) {
  return (
    <PanelShell
      title="Meus Eventos"
      emoji="📅"
      gradient="linear-gradient(135deg, #EC4899, #DB2777)"
      onClose={onClose}
    >
      <div className="space-y-3">
        <PanelCard label="Sunset no Parque" subtitle="Evento • 16:00 hoje" stats="48 confirmados" />
        <div className="flex gap-2 mt-4">
          <PanelAction icon={Users} label="Participantes" />
          <PanelAction icon={MapPinned} label="Mapa" />
          <PanelAction icon={Tag} label="Ingressos" />
          <PanelAction icon={Settings} label="Editar" />
        </div>
      </div>
    </PanelShell>
  );
}

function PanelLocais({ onClose }: { onClose: () => void }) {
  return (
    <PanelShell
      title="Meus Locais"
      emoji="📍"
      gradient="linear-gradient(135deg, #3B82F6, #2563EB)"
      onClose={onClose}
    >
      <div className="space-y-3">
        <PanelCard label="Café Central" subtitle="Cafés • 200m" stats="4.6 ⭐ (1.2k)" />
        <div className="flex gap-2 mt-4">
          <PanelAction icon={MapPinned} label="Mapa" />
          <PanelAction icon={Settings} label="Editar" />
          <PanelAction icon={Trash2} label="Excluir" danger />
        </div>
      </div>
    </PanelShell>
  );
}

function PanelPromocoes({ onClose }: { onClose: () => void }) {
  return (
    <PanelShell
      title="Minhas Promoções"
      emoji="🏷️"
      gradient="linear-gradient(135deg, #8B5CF6, #7C3AED)"
      onClose={onClose}
    >
      <div className="space-y-3">
        <PanelCard
          label="20% OFF em cafés"
          subtitle="Válido até 30/08"
          stats="32 resgates"
          status="active"
        />
        <PanelCard
          label="Combo duplo R$39"
          subtitle="Válido até 15/09"
          stats="18 resgates"
          status="paused"
        />
        <div className="flex gap-2 mt-4">
          <PanelAction icon={Settings} label="Ativar" />
          <PanelAction icon={PauseCircle} label="Pausar" />
          <PanelAction icon={Copy} label="Duplicar" />
          <PanelAction icon={Trash2} label="Excluir" danger />
        </div>
      </div>
    </PanelShell>
  );
}

function PanelMobilidade({ onClose }: { onClose: () => void }) {
  return (
    <PanelShell
      title="Mobilidade"
      emoji="🚗"
      gradient="linear-gradient(135deg, #22C55E, #16A34A)"
      onClose={onClose}
    >
      <div className="space-y-3">
        <PanelCard label="Corridas realizadas" subtitle="Últimos 7 dias" stats="23 corridas" />
        <PanelCard label="Ganhos da semana" subtitle="Líquido" stats="R$ 487,00" />
        <div className="flex gap-2 mt-4">
          <PanelAction icon={Car} label="Corridas" />
          <PanelAction icon={BarChart3} label="Ganhos" />
          <PanelAction icon={Clock} label="Histórico" />
          <PanelAction icon={Star} label="Avaliações" />
        </div>
      </div>
    </PanelShell>
  );
}

/* ─── Panel shell ────────────────────────────────────── */

function PanelShell({
  title,
  emoji,
  gradient,
  onClose,
  children,
}: {
  title: string;
  emoji: string;
  gradient: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
        style={{
          borderRadius: `${Radius.lg} ${Radius.lg} 0 0`,
          backgroundColor: Colors.background,
          boxShadow: Shadows.large,
        }}
      >
        <div className="px-6 pt-5 pb-4 text-white" style={{ background: gradient }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{emoji}</span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 grid place-items-center hover:bg-white/30 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <div className="px-6 py-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function PanelCard({
  label,
  subtitle,
  stats,
  status,
}: {
  label: string;
  subtitle: string;
  stats: string;
  status?: "active" | "paused";
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border shadow-soft">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[11px] text-muted-foreground">{subtitle}</div>
      </div>
      <div className="text-right">
        <div className="text-xs font-bold">{stats}</div>
        {status && (
          <span
            className={`text-[10px] font-semibold ${status === "active" ? "text-success" : "text-muted-foreground"}`}
          >
            {status === "active" ? "Ativo" : "Pausado"}
          </span>
        )}
      </div>
    </div>
  );
}

function PanelAction({
  icon: Icon,
  label,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  danger?: boolean;
}) {
  return (
    <button className="flex flex-1 flex-col items-center gap-1 py-2.5 rounded-xl bg-surface border border-border hover:border-primary/30 transition-colors">
      <Icon size={16} className={danger ? "text-danger" : "text-primary"} />
      <span
        className={`text-[10px] font-semibold ${danger ? "text-danger" : "text-muted-foreground"}`}
      >
        {label}
      </span>
    </button>
  );
}

/* ─── Main Page ──────────────────────────────────────── */

function MyConnexyPage() {
  const navigate = useNavigate();
  const [rolesState, setRolesState] = useState<UserRolesState>(getStoredRoles);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [activeWizard, setActiveWizard] = useState<WizardType>(null);

  useEffect(() => {
    function handleChange() {
      setRolesState(getStoredRoles());
    }
    window.addEventListener("roleChanged", handleChange);
    return () => window.removeEventListener("roleChanged", handleChange);
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => rolesState.roles.includes(role),
    [rolesState.roles],
  );
  const activeRoles = rolesState.roles.filter((r) => r !== UserRole.USER);

  function handleWizardComplete() {
    setActiveWizard(null);
    window.dispatchEvent(new Event("roleChanged"));
  }

  function openPanel(id: string) {
    setActivePanel(id);
  }

  function openWizard(type: WizardType) {
    setActiveWizard(type);
  }

  const animatedItem = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.04, duration: 0.3, ease: "easeOut" as const },
    }),
  };

  return (
    <div className="flex-1 pb-24">
      <StatusBar />

      {/* ─── Scrollable content ─── */}
      <div className="overflow-y-auto h-full px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-3 pb-5"
        >
          <div className="flex items-center gap-4">
            <img
              src={currentUser.photo}
              alt={currentUser.name}
              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white shadow-soft"
            />
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold" style={{ color: Colors.text.primary }}>
                Meu Connexy
              </h1>
              <p className="text-xs text-muted-foreground">Seu centro de gerenciamento.</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{currentUser.name}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">São Paulo</span>
                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  Nível 4
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Resumo */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resumo
            </h2>
            {activeRoles.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {activeRoles.length} ativo{activeRoles.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {RESUMO_ITEMS.map((item, i) => {
              const active = hasRole(item.role);
              return (
                <motion.button
                  key={item.id}
                  custom={i}
                  variants={animatedItem}
                  initial="hidden"
                  animate="visible"
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    active ? openPanel(item.id) : navigate({ to: "/profile/roles" as never })
                  }
                  className={`relative overflow-hidden rounded-2xl p-4 text-left border transition-all ${
                    active
                      ? "border-border bg-surface shadow-soft"
                      : `${item.bgLight} border-transparent`
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="w-10 h-10 rounded-xl grid place-items-center text-lg"
                      style={{ background: `${item.color}15` }}
                    >
                      {item.emoji}
                    </span>
                    {active ? (
                      <span className="text-xs font-bold" style={{ color: item.color }}>
                        {item.count}
                      </span>
                    ) : (
                      <Plus size={14} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {active ? "Toque para gerenciar" : "Criar agora"}
                  </div>
                  {active && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: item.color, opacity: 0.3 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Estatísticas */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Estatísticas
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.id}
                custom={i}
                variants={animatedItem}
                initial="hidden"
                animate="visible"
                className="rounded-2xl bg-surface border border-border p-3 shadow-soft"
              >
                <stat.icon size={14} className="text-primary mb-1.5" />
                <div className="text-sm font-bold">{stat.value}</div>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[10px] font-semibold ${stat.positive ? "text-success" : "text-danger"}`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{stat.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Atividades Recentes */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Atividade recente
          </h2>
          <div className="space-y-2">
            {ACTIVITIES.map((act, i) => (
              <motion.div
                key={act.id}
                custom={i}
                variants={animatedItem}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border shadow-soft"
              >
                <span className="text-lg">{act.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{act.text}</div>
                  <div className="text-[10px] text-muted-foreground">{act.time}</div>
                </div>
                <ChevronRight size={14} className="text-muted-foreground shrink-0" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Ações Rápidas */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Ações rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Criar Negócio",
                emoji: "🏢",
                gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
                wizard: "negocio" as WizardType,
              },
              {
                label: "Criar Evento",
                emoji: "📅",
                gradient: "linear-gradient(135deg, #EC4899, #DB2777)",
                wizard: "evento" as WizardType,
              },
              {
                label: "Criar Local",
                emoji: "📍",
                gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
                wizard: "local" as WizardType,
              },
              {
                label: "Nova Oferta",
                emoji: "🏷️",
                gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
                wizard: "oferta" as WizardType,
              },
              {
                label: "Nova Publicação",
                emoji: "📝",
                gradient: "linear-gradient(135deg, #6C3BFF, #4B21D6)",
                wizard: "publicacao" as WizardType,
              },
              {
                label: "Começar Corrida",
                emoji: "🚗",
                gradient: "linear-gradient(135deg, #22C55E, #16A34A)",
                wizard: null,
                route: "/driver",
              },
            ].map((action, i) => (
              <motion.button
                key={action.label}
                custom={i}
                variants={animatedItem}
                initial="hidden"
                animate="visible"
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  action.route ? navigate({ to: action.route as never }) : openWizard(action.wizard)
                }
                className="flex items-center gap-3 p-4 rounded-2xl text-white shadow-floating"
                style={{ background: action.gradient }}
              >
                <span className="text-2xl">{action.emoji}</span>
                <span className="text-sm font-bold">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Management Panel Overlays */}
        <AnimatePresence>
          {activePanel === "negocios" && <PanelNegocios onClose={() => setActivePanel(null)} />}
          {activePanel === "eventos" && <PanelEventos onClose={() => setActivePanel(null)} />}
          {activePanel === "locais" && <PanelLocais onClose={() => setActivePanel(null)} />}
          {activePanel === "ofertas" && <PanelPromocoes onClose={() => setActivePanel(null)} />}
          {activePanel === "mobilidade" && <PanelMobilidade onClose={() => setActivePanel(null)} />}
        </AnimatePresence>

        {/* Wizard Overlays */}
        <WizardBase
          open={activeWizard === "negocio"}
          onClose={() => setActiveWizard(null)}
          title="Criar Negócio"
          icon="🏢"
          gradient="linear-gradient(135deg, #F59E0B, #D97706)"
          steps={negocioSteps()}
          onComplete={handleWizardComplete}
        />
        <WizardBase
          open={activeWizard === "evento"}
          onClose={() => setActiveWizard(null)}
          title="Criar Evento"
          icon="📅"
          gradient="linear-gradient(135deg, #EC4899, #DB2777)"
          steps={eventSteps()}
          onComplete={handleWizardComplete}
        />
        <WizardBase
          open={activeWizard === "local"}
          onClose={() => setActiveWizard(null)}
          title="Criar Local"
          icon="📍"
          gradient="linear-gradient(135deg, #3B82F6, #2563EB)"
          steps={localSteps()}
          onComplete={handleWizardComplete}
        />
        <WizardBase
          open={activeWizard === "oferta"}
          onClose={() => setActiveWizard(null)}
          title="Nova Oferta"
          icon="🏷️"
          gradient="linear-gradient(135deg, #8B5CF6, #7C3AED)"
          steps={offerSteps()}
          onComplete={handleWizardComplete}
        />
        <WizardBase
          open={activeWizard === "publicacao"}
          onClose={() => setActiveWizard(null)}
          title="Nova Publicação"
          icon="📝"
          gradient="linear-gradient(135deg, #6C3BFF, #4B21D6)"
          steps={publicacaoSteps()}
          onComplete={handleWizardComplete}
        />
      </div>
    </div>
  );
}
