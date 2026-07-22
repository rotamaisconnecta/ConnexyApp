import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { BrandScreen } from "@/components/ui/brand-screen";
import { BrandButton } from "@/components/ui/brand-button";
import { BrandCard } from "@/components/ui/brand-card";
import { BrandInput } from "@/components/ui/brand-input";
import { BrandBadge } from "@/components/ui/brand-badge";
import { BrandDivider } from "@/components/ui/brand-divider";
import { BrandAvatar } from "@/components/ui/brand-avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { BrandGradient } from "@/components/ui/brand-gradient";
import { AppBar } from "@/components/system/app-bar";
import { Tabs } from "@/components/system/tabs";
import { SegmentedControl } from "@/components/system/segmented-control";
import { SearchBar } from "@/components/system/search-bar";
import { Chip } from "@/components/system/chip";
import { ChipGroup } from "@/components/system/chip-group";
import { BadgeCounter } from "@/components/system/badge-counter";
import { AvatarGroup } from "@/components/system/avatar-group";
import { RatingStars } from "@/components/system/rating-stars";
import { ProgressBar } from "@/components/system/progress-bar";
import { CircularProgress } from "@/components/system/circular-progress";
import { EmptyState } from "@/components/system/empty-state";
import { ErrorState } from "@/components/system/error-state";
import { Skeleton } from "@/components/system/skeleton";
import { LoadingScreen } from "@/components/system/loading-screen";
import { LoadingCard } from "@/components/system/loading-card";
import { Modal } from "@/components/system/modal";
import { BottomSheet } from "@/components/system/bottom-sheet";
import { ConfirmDialog } from "@/components/system/confirm-dialog";
import { FloatingActionButton } from "@/components/system/floating-action-button";
import { PremiumCard } from "@/components/system/premium-card";
import { GlassCard } from "@/components/system/glass-card";
import { SectionHeader } from "@/components/system/section-header";
import { SectionDivider } from "@/components/system/section-divider";
import { FilterBar } from "@/components/system/filter-bar";
import { Carousel } from "@/components/system/carousel";
import { HorizontalScroller } from "@/components/system/horizontal-scroller";
import { Tooltip } from "@/components/system/tooltip";
import { ReactionPicker } from "@/components/system/reaction-picker";
import { MapPreview } from "@/components/system/map-preview";
import { ImageGallery } from "@/components/system/image-gallery";
import { VideoPlayer } from "@/components/system/video-player";
import { AudioPlayer } from "@/components/system/audio-player";
import { useModal } from "@/hooks/system/use-modal";
import { useBottomSheet } from "@/hooks/system/use-bottom-sheet";
import { useToast } from "@/hooks/system/use-toast";
import { Users, Heart, Star, Zap, Coffee, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/design-system")({
  head: () => ({ meta: [{ title: "Design System — Connexy" }] }),
  component: DesignSystemPage,
});

const DEMO_TABS = [
  { id: "all", label: "Todos" },
  { id: "ui", label: "UI" },
  { id: "feedback", label: "Feedback" },
  { id: "media", label: "Mídia" },
];

const DEMO_CHIPS = [
  { id: "1", label: "Tecnologia" },
  { id: "2", label: "Música" },
  { id: "3", label: "Esportes" },
  { id: "4", label: "Arte" },
  { id: "5", label: "Gastronomia" },
];

const DEMO_FILTERS = [
  { id: "all", label: "Todos", active: true },
  { id: "nearby", label: "Próximos", active: false },
  { id: "online", label: "Online", active: false },
  { id: "favorites", label: "Favoritos", active: false },
];

const DEMO_REACTIONS = ["❤️", "🔥", "👏", "😍", "🎉", "💯"];

const DEMO_GALLERY = [
  { id: "1", src: "https://picsum.photos/400/400?random=1", alt: "Photo 1" },
  { id: "2", src: "https://picsum.photos/400/400?random=2", alt: "Photo 2" },
  { id: "3", src: "https://picsum.photos/400/400?random=3", alt: "Photo 3" },
  { id: "4", src: "https://picsum.photos/400/400?random=4", alt: "Photo 4" },
];

function DesignSystemPage() {
  const modal = useModal();
  const bottomSheet = useBottomSheet();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [segment, setSegment] = useState("grid");
  const [search, setSearch] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>(["1"]);
  const [rating, setRating] = useState(3);
  const [progress, setProgress] = useState(65);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <BrandScreen safeArea={false} padded={false}>
      <StatusBar />

      <AppBar title="Design System" />

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-5 pt-4">
          <BrandLogo size="md" />
        </div>

        <SectionDivider className="my-4" />

        <section className="px-5 space-y-4">
          <SectionHeader title="Branding" />
          <BrandCard>
            <p className="text-sm text-[#71717A]">
              BrandButton, BrandCard, BrandInput, BrandBadge...
            </p>
          </BrandCard>
          <div className="flex flex-wrap gap-2">
            <BrandButton size="sm">Primary</BrandButton>
            <BrandButton size="sm" variant="secondary">
              Secondary
            </BrandButton>
            <BrandButton size="sm" variant="ghost">
              Ghost
            </BrandButton>
            <BrandButton size="sm" variant="outline">
              Outline
            </BrandButton>
            <BrandButton size="sm" variant="danger">
              Danger
            </BrandButton>
            <BrandButton size="sm" variant="premium">
              Premium
            </BrandButton>
          </div>
          <BrandInput placeholder="BrandInput example" />
          <div className="flex flex-wrap gap-2">
            <BrandBadge variant="default">Default</BrandBadge>
            <BrandBadge variant="success">Success</BrandBadge>
            <BrandBadge variant="warning">Warning</BrandBadge>
            <BrandBadge variant="danger">Danger</BrandBadge>
            <BrandBadge variant="premium">Premium</BrandBadge>
          </div>
          <BrandGradient
            variant="primary"
            className="h-12 rounded-[18px] flex items-center justify-center"
          >
            <span className="text-white text-sm font-semibold">BrandGradient</span>
          </BrandGradient>
        </section>

        <SectionDivider className="my-4" />

        <section className="px-5 space-y-4">
          <SectionHeader title="Navigation" />
          <Tabs items={DEMO_TABS} activeTab={activeTab} onChange={setActiveTab} />
          <SegmentedControl
            options={[
              { id: "grid", label: "Grid" },
              { id: "list", label: "Lista" },
              { id: "map", label: "Mapa" },
            ]}
            value={segment}
            onChange={setSegment}
          />
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar..." />
          <FilterBar filters={DEMO_FILTERS} onToggle={(id) => console.log("filter", id)} />
        </section>

        <SectionDivider className="my-4" />

        <section className="px-5 space-y-4">
          <SectionHeader title="Display" />
          <ChipGroup
            chips={DEMO_CHIPS}
            selectedIds={selectedChips}
            onToggle={(id) => {
              setSelectedChips((prev) =>
                prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
              );
            }}
            multiple
          />
          <div className="flex gap-2">
            <BadgeCounter count={3} />
            <BadgeCounter count={150} />
            <BadgeCounter count={0} />
          </div>
          <AvatarGroup
            avatars={[{ alt: "A" }, { alt: "B" }, { alt: "C" }, { alt: "D" }, { alt: "E" }]}
          />
          <RatingStars value={rating} interactive onChange={setRating} />
          <ReactionPicker reactions={DEMO_REACTIONS} onSelect={(e) => toast.info(`Reação: ${e}`)} />
        </section>

        <SectionDivider className="my-4" />

        <section className="px-5 space-y-4">
          <SectionHeader title="Progress" />
          <ProgressBar value={progress} showLabel />
          <div className="flex gap-4 items-center">
            <CircularProgress value={progress} />
            <CircularProgress value={progress} size={64} strokeWidth={6} />
            <button onClick={() => setProgress((p) => (p >= 100 ? 0 : p + 10))}>
              <BrandButton size="sm" variant="secondary">
                +10%
              </BrandButton>
            </button>
          </div>
        </section>

        <SectionDivider className="my-4" />

        <section className="px-5 space-y-4">
          <SectionHeader title="Feedback" />
          <div className="flex flex-wrap gap-2">
            <BrandButton size="sm" onClick={() => toast.success("Sucesso!", "Operação realizada")}>
              Toast Success
            </BrandButton>
            <BrandButton
              size="sm"
              variant="danger"
              onClick={() => toast.danger("Erro!", "Algo deu errado")}
            >
              Toast Danger
            </BrandButton>
            <BrandButton
              size="sm"
              variant="secondary"
              onClick={() => toast.info("Info", "Mensagem informativa")}
            >
              Toast Info
            </BrandButton>
          </div>
          <BrandButton size="sm" onClick={modal.open}>
            Abrir Modal
          </BrandButton>
          <BrandButton size="sm" variant="secondary" onClick={() => bottomSheet.open()}>
            Abrir Bottom Sheet
          </BrandButton>
          <BrandButton size="sm" variant="outline" onClick={() => setShowConfirm(true)}>
            Confirm Dialog
          </BrandButton>
        </section>

        <SectionDivider className="my-4" />

        <section className="px-5 space-y-4">
          <SectionHeader title="Cards Premium" />
          <PremiumCard>
            <p className="text-sm font-medium text-[#18181B]">PremiumCard</p>
            <p className="text-xs text-[#71717A]">Gradiente e glow automático</p>
          </PremiumCard>
          <GlassCard>
            <p className="text-sm font-medium text-[#18181B]">GlassCard</p>
            <p className="text-xs text-[#71717A]">Glassmorphism com blur</p>
          </GlassCard>
        </section>

        <SectionDivider className="my-4" />

        <section className="px-5 space-y-4">
          <SectionHeader title="Empty / Error" />
          <EmptyState
            icon={Users}
            title="Nenhum resultado"
            description="Tente ajustar seus filtros"
            actionLabel="Limpar filtros"
            onAction={() => {}}
          />
          <ErrorState message="Não foi possível carregar os dados" onRetry={() => {}} />
        </section>

        <SectionDivider className="my-4" />

        <section className="px-5 space-y-4">
          <SectionHeader title="Skeleton" />
          <Skeleton variant="LIST" count={3} />
        </section>

        <SectionDivider className="my-4" />

        <section className="px-5 space-y-4">
          <SectionHeader title="Tooltips" />
          <div className="flex gap-4">
            <Tooltip content="Tooltip acima">
              <BrandButton size="sm" variant="secondary">
                Hover
              </BrandButton>
            </Tooltip>
          </div>
        </section>

        <SectionDivider className="my-4" />

        <section className="px-5 space-y-4">
          <SectionHeader title="Media" />
          <MapPreview latitude={-23.5505} longitude={-46.6333} title="São Paulo" distance="2.3km" />
        </section>
      </div>

      <Modal isOpen={modal.isOpen} onClose={modal.close} title="Exemplo Modal">
        <p className="text-sm text-[#71717A] mb-4">Este é um modal de exemplo do Design System.</p>
        <BrandButton onClick={modal.close} className="w-full">
          Fechar
        </BrandButton>
      </Modal>

      <BottomSheet
        isOpen={bottomSheet.isOpen}
        onClose={bottomSheet.close}
        title="Exemplo Bottom Sheet"
      >
        <p className="text-sm text-[#71717A] mb-4">Bottom sheet com arrasto e snap.</p>
        <BrandButton onClick={bottomSheet.close} className="w-full">
          Fechar
        </BrandButton>
      </BottomSheet>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          toast.success("Confirmado!");
        }}
        title="Tem certeza?"
        message="Esta ação não pode ser desfeita."
        danger
      />

      <FloatingActionButton icon={Zap} />
    </BrandScreen>
  );
}
