import { Brain } from "lucide-react";
import type { Recommendation, EngineNotification } from "@/lib/engine/engine-types";
import { RecommendationType } from "@/lib/engine/engine-types";
import {
  Users,
  Calendar,
  Building2,
  MapPin,
  Film,
  Car,
  Ticket,
} from "lucide-react";
import { RecommendationSection } from "./recommendation-section";
import { SmartAlert } from "./smart-alert";

interface DashboardData {
  topPeople: Recommendation[];
  topEvents: Recommendation[];
  topBusinesses: Recommendation[];
  topPlaces: Recommendation[];
  topReels: Recommendation[];
  topDrivers: Recommendation[];
  topOffers: Recommendation[];
  notifications: EngineNotification[];
}

interface EngineDashboardProps {
  data: DashboardData;
}

const SECTION_CONFIG = [
  { key: "topPeople" as const, title: "Pessoas para Conhecer", icon: <Users className="h-4 w-4 text-[#A88DFF]" /> },
  { key: "topEvents" as const, title: "Eventos em Alta", icon: <Calendar className="h-4 w-4 text-[#A88DFF]" /> },
  { key: "topBusinesses" as const, title: "Empresas Populares", icon: <Building2 className="h-4 w-4 text-[#A88DFF]" /> },
  { key: "topPlaces" as const, title: "Lugares Quentes", icon: <MapPin className="h-4 w-4 text-[#A88DFF]" /> },
  { key: "topReels" as const, title: "Reels em Destaque", icon: <Film className="h-4 w-4 text-[#A88DFF]" /> },
  { key: "topDrivers" as const, title: "Motoristas Próximos", icon: <Car className="h-4 w-4 text-[#A88DFF]" /> },
  { key: "topOffers" as const, title: "Melhores Ofertas", icon: <Ticket className="h-4 w-4 text-[#A88DFF]" /> },
];

export function EngineDashboard({ data }: EngineDashboardProps) {
  const allItems = [
    ...data.topPeople,
    ...data.topEvents,
    ...data.topBusinesses,
    ...data.topPlaces,
    ...data.topReels,
    ...data.topDrivers,
    ...data.topOffers,
  ];
  const avgScore =
    allItems.length > 0
      ? Math.round(
          (allItems.reduce((acc, item) => acc + item.score.total, 0) / allItems.length) * 100,
        )
      : 0;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-[#E7E7F2] bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F1FF]">
            <Brain className="h-5 w-5 text-[#A88DFF]" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold text-[#18181B]">Connexy Engine</h1>
            <p className="text-xs text-[#71717A]">Score médio: {avgScore}%</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 py-4">
        {SECTION_CONFIG.map(({ key, title, icon }) => (
          <RecommendationSection
            key={key}
            title={title}
            icon={icon}
            items={data[key]}
          />
        ))}

        {data.notifications.length > 0 && (
          <div className="space-y-2 px-4">
            <h2 className="font-display text-sm font-semibold text-[#18181B]">
              Alertas Inteligentes
            </h2>
            <div className="space-y-2">
              {data.notifications.map((notification) => (
                <SmartAlert key={notification.id} notification={notification} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
