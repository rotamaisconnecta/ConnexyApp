import { useState, useMemo, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { StatusBar } from "@/components/phone-frame";
import { Users, Calendar, Building2, Car, MapPin, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { currentUser, places, drivers, people as mockPeople } from "@/lib/mock-data";
import { usePresence } from "@/providers/presence/presence-provider";
import { formatPersonDistance } from "@/lib/proximity";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { useDiscovery } from "@/hooks/api/use-discovery";
import type { NearbyProfile } from "@/types/phase-13b";

const searchSchema = z.object({
  filter: z.enum(["places", "people"]).optional(),
});

export const Route = createFileRoute("/_app/discover")({
  head: () => ({ meta: [{ title: "Explorar — Connexy" }] }),
  validateSearch: searchSchema,
  component: DiscoverPage,
});

type MapFilter = "todos" | "pessoas" | "eventos" | "negocios" | "motoristas" | "locais";

const FILTERS: { id: MapFilter; label: string; icon: typeof Users; color: string }[] = [
  { id: "todos", label: "Todos", icon: MapIcon, color: "text-primary bg-primary/10" },
  { id: "pessoas", label: "Pessoas", icon: Users, color: "text-blue-500 bg-blue-100" },
  { id: "eventos", label: "Eventos", icon: Calendar, color: "text-pink-500 bg-pink-100" },
  { id: "negocios", label: "Negócios", icon: Building2, color: "text-amber-500 bg-amber-100" },
  { id: "motoristas", label: "Motoristas", icon: Car, color: "text-green-500 bg-green-100" },
  { id: "locais", label: "Locais", icon: MapPin, color: "text-purple-500 bg-purple-100" },
];

const GRADIENT_BG = "bg-gradient-to-b from-primary/5 to-background";

function DiscoverPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [activeFilter, setActiveFilter] = useState<MapFilter>("todos");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const { checkins, placeUpdates } = usePresence();
  const { people: nearbyProfiles } = useDiscovery();

  const presencePeople = useMemo(
    () =>
      checkins.filter(
        (r) => !r.leftAt && (r.visibility === "PUBLIC" || r.visibility === "FRIENDS"),
      ),
    [checkins],
  );
  const anonymousCheckins = useMemo(
    () => checkins.filter((r) => !r.leftAt && r.visibility === "ANONYMOUS"),
    [checkins],
  );

  useEffect(() => {
    if (search.filter === "places") {
      setActiveFilter("locais");
      setSelectedItem(null);
    } else if (search.filter === "people") {
      setActiveFilter("pessoas");
      setSelectedItem(null);
    }
  }, [search.filter]);

  const mapItems = useMemo(() => {
    const items: Array<{
      id: string;
      name: string;
      type: MapFilter;
      distanceMeters: number;
      distanceLabel: string;
      photo?: string;
      icon: string;
      color: string;
      subtitle: string;
      targetId?: string;
    }> = [];

    if (activeFilter === "todos" || activeFilter === "pessoas") {
      const profilesToUse = isPublicSupabaseConfigured()
        ? nearbyProfiles.slice(0, 7).map((p: NearbyProfile) => ({
            id: p.id,
            name: p.name,
            distanceMeters: (p.distance_km ?? 0) * 1000,
            photo: p.photo_url ?? undefined,
            interests: p.common_interests ?? [],
          }))
        : mockPeople.slice(0, 7).map((person) => ({
            id: person.id,
            name: person.name,
            distanceMeters: person.distanceMeters,
            photo: person.photo,
            interests: person.interests,
          }));

      profilesToUse.forEach((p) => {
        items.push({
          id: p.id,
          name: p.name,
          type: "pessoas",
          distanceMeters: p.distanceMeters,
          distanceLabel: formatPersonDistance(p.distanceMeters),
          photo: p.photo,
          icon: "👤",
          color: "bg-blue-100 border-blue-200",
          subtitle: p.interests.slice(0, 2).join(", "),
          targetId: p.id,
        });
      });

      presencePeople.forEach((record) => {
        items.push({
          id: `prs-${record.id}`,
          name: record.userName,
          type: "pessoas",
          distanceMeters: 0,
          distanceLabel: "presente",
          photo: record.userPhoto,
          icon: "📍",
          color: "bg-emerald-100 border-emerald-200",
          subtitle: `📍 presente em ${record.targetName}`,
          targetId: record.userId,
        });
      });
    }

    if (activeFilter === "todos" || activeFilter === "locais") {
      places.slice(0, 6).forEach((p) => {
        const update = placeUpdates.find((u) => u.placeId === p.id);
        items.push({
          id: p.id,
          name: p.name,
          type: "locais",
          distanceMeters: p.distanceMeters,
          distanceLabel:
            p.distanceMeters < 1000
              ? `${p.distanceMeters}m`
              : `${(p.distanceMeters / 1000).toFixed(1)}km`,
          icon: "📍",
          color: "bg-purple-100 border-purple-200",
          subtitle:
            update && update.checkinCount > 0
              ? `${p.category} • ${update.checkinCount} presentes${update.anonymousCount > 0 ? ` • 🙈 ${update.anonymousCount} anônimos` : ""}`
              : p.category,
        });
      });
    }

    if (activeFilter === "todos" || activeFilter === "motoristas") {
      drivers.forEach((d) => {
        items.push({
          id: d.id,
          name: d.name,
          type: "motoristas",
          distanceMeters: d.distanceMeters,
          distanceLabel:
            d.distanceMeters < 1000
              ? `${d.distanceMeters}m`
              : `${(d.distanceMeters / 1000).toFixed(1)}km`,
          photo: d.photo,
          icon: "🚗",
          color: "bg-green-100 border-green-200",
          subtitle: d.car,
        });
      });
    }

    if (activeFilter === "todos" || activeFilter === "negocios") {
      places.slice(0, 6).forEach((p) => {
        const update = placeUpdates.find((u) => u.placeId === p.id);
        items.push({
          id: `biz-${p.id}`,
          name: p.name,
          type: "negocios",
          distanceMeters: p.distanceMeters,
          distanceLabel:
            p.distanceMeters < 1000
              ? `${p.distanceMeters}m`
              : `${(p.distanceMeters / 1000).toFixed(1)}km`,
          icon: "🏪",
          color: "bg-amber-100 border-amber-200",
          subtitle:
            update && update.checkinCount > 0
              ? `${p.rating} ★ • ${update.checkinCount} presentes`
              : `${p.rating} ★`,
        });
      });
    }

    if (activeFilter === "todos" || activeFilter === "eventos") {
      places
        .filter((p) => p.category === "Eventos")
        .forEach((p) => {
          items.push({
            id: `evt-${p.id}`,
            name: p.name,
            type: "eventos",
            distanceMeters: p.distanceMeters,
            distanceLabel:
              p.distanceMeters < 1000
                ? `${p.distanceMeters}m`
                : `${(p.distanceMeters / 1000).toFixed(1)}km`,
            icon: "🎉",
            color: "bg-pink-100 border-pink-200",
            subtitle: p.hours,
          });
        });
    }

    return items.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [activeFilter, placeUpdates, presencePeople, nearbyProfiles]);

  return (
    <div className="flex-1">
      <StatusBar />

      <header className="px-5 pt-1 pb-3">
        <h1 className="font-display font-bold text-lg">Explorar por perto</h1>
        <p className="text-xs text-muted-foreground">
          {currentUser.interests[0] ?? ""} · Próximo a você
        </p>
      </header>

      <div className="sticky top-0 z-10 bg-background px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  setActiveFilter(filter.id);
                  setSelectedItem(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-all border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-soft"
                    : "bg-surface text-muted-foreground border-border hover:bg-accent/50",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="mx-4 rounded-3xl bg-surface border border-border overflow-hidden shadow-soft"
        style={{ height: "calc(100vw * 0.75)", maxHeight: "400px" }}
      >
        <div className="h-full w-full bg-gradient-to-br from-primary/5 via-accent/30 to-secondary/50 relative flex items-center justify-center">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 30%, var(--color-primary) 0%, transparent 50%), radial-gradient(circle at 80% 70%, var(--color-primary) 0%, transparent 50%)`,
            }}
          />
          <div className="relative text-center">
            <MapPin className="h-8 w-8 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Mapa interativo</p>
          </div>

          {mapItems.slice(0, 6).map((item, i) => {
            const positions = [
              { top: "15%", left: "25%" },
              { top: "30%", left: "65%" },
              { top: "55%", left: "20%" },
              { top: "45%", left: "75%" },
              { top: "70%", left: "40%" },
              { top: "25%", left: "45%" },
            ];
            const pos = positions[i % positions.length];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                className={cn(
                  "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110",
                  selectedItem === item.id ? "z-10 scale-110" : "",
                )}
                style={{ top: pos.top, left: pos.left }}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shadow-soft border-2 text-xs border-white",
                    item.color,
                  )}
                >
                  {item.photo ? (
                    <img
                      src={item.photo}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    item.icon
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[10px] text-muted-foreground">
            📍 Presença pública e de amigos no mapa · anônimos não aparecem
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground">
            🙈 {anonymousCheckins.length} anônimo{anonymousCheckins.length !== 1 ? "s" : ""} no
            total
          </span>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold">
            {activeFilter === "todos"
              ? "Próximo a você"
              : FILTERS.find((f) => f.id === activeFilter)?.label}
          </h3>
          <span className="text-[11px] text-muted-foreground">{mapItems.length} encontrados</span>
        </div>
        <div className="space-y-2">
          {mapItems.slice(0, 10).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.type === "pessoas") {
                  if (item.targetId) {
                    navigate({ to: "/perfil/$id", params: { id: item.targetId } });
                  }
                } else if (item.type === "locais") {
                  navigate({ to: "/local/$id", params: { id: item.id } });
                } else if (item.type === "negocios") {
                  navigate({
                    to: "/local/$id",
                    params: { id: item.id.replace(/^biz-/, "") },
                  });
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border hover:bg-accent/50 transition-colors text-left"
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-sm shrink-0",
                  item.color,
                )}
              >
                {item.photo ? (
                  <img
                    src={item.photo}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  item.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{item.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{item.subtitle}</div>
              </div>
              <div className="text-[10px] text-muted-foreground shrink-0">{item.distanceLabel}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
