import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapCanvas } from "@/components/map-canvas";
import { StatusBar } from "@/components/phone-frame";
import {
  ChevronLeft,
  MapPin,
  ArrowUpDown,
  Navigation,
  Clock,
  Home as HomeIcon,
  Briefcase,
  ShoppingBag,
  Plane,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

type PlaceSuggestion = {
  id: string;
  name: string;
  address: string;
  distance: string;
  icon: React.ReactNode;
  x: number;
  y: number;
};

const suggestions: PlaceSuggestion[] = [
  {
    id: "casa",
    name: "Casa",
    address: "Rua Augusta, 1200 - Consolação",
    distance: "1,2 km",
    icon: <HomeIcon className="h-4 w-4" />,
    x: 75,
    y: 20,
  },
  {
    id: "trabalho",
    name: "Trabalho",
    address: "Av. Paulista, 1000 - Bela Vista",
    distance: "2,8 km",
    icon: <Briefcase className="h-4 w-4" />,
    x: 30,
    y: 35,
  },
  {
    id: "shopping",
    name: "Shopping Ibirapuera",
    address: "Av. Pedro Álvares Cabral, s/n - Vila Mariana",
    distance: "3,5 km",
    icon: <ShoppingBag className="h-4 w-4" />,
    x: 60,
    y: 55,
  },
  {
    id: "aeroporto",
    name: "Aeroporto de Congonhas",
    address: "Av. Washington Luís, s/n - Campo Belo",
    distance: "7,1 km",
    icon: <Plane className="h-4 w-4" />,
    x: 20,
    y: 70,
  },
];

export const Route = createFileRoute("/_app/destino")({
  head: () => ({ meta: [{ title: "Definir destino — RotaMais" }] }),
  component: DestinationPage,
});

function DestinationPage() {
  const nav = useNavigate();
  const [currentLocation] = useState("Minha localização");
  const [destination, setDestination] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [route, setRoute] = useState(false);

  function handleSelectPlace(place: PlaceSuggestion) {
    setSelectedPlace(place);
    setDestination(place.name);
    setEstimatedDistance(place.distance);
    setEstimatedTime(calculateTime(place.distance));
    setRoute(true);
  }

  function calculateTime(distance: string): string {
    const km = parseFloat(distance.replace(",", ".").replace(" km", ""));
    const minutes = Math.round(km * 3.5);
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? ` ${m}min` : ""}`;
  }

  function handleSwap() {
    if (selectedPlace) {
      setSelectedPlace(null);
      setDestination("");
      setEstimatedDistance(null);
      setEstimatedTime(null);
      setRoute(false);
    }
  }

  const originPins = [{ x: 20, y: 85, kind: "user" as const, label: "Você" }];
  const destinationPins = selectedPlace
    ? [
        {
          x: selectedPlace.x,
          y: selectedPlace.y,
          kind: "place" as const,
          label: selectedPlace.name,
        },
      ]
    : [];

  return (
    <div className="flex-1 flex flex-col">
      {/* Map */}
      <div className="relative">
        <MapCanvas height={280} route={route} pins={[...originPins, ...destinationPins]} />
        <div className="absolute top-0 left-0 right-0">
          <StatusBar />
        </div>

        {/* Back button */}
        <button
          onClick={() => nav({ to: "/home" })}
          className="absolute top-14 left-4 h-10 w-10 grid place-items-center rounded-full bg-white shadow-soft"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Bottom sheet */}
      <div className="-mt-6 relative bg-surface rounded-t-3xl px-5 pt-5 pb-4 border-t border-border flex-1 overflow-y-auto no-scrollbar">
        <div className="h-1 w-10 rounded-full bg-border mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="font-display text-lg font-bold">Definir destino</h1>
            <p className="text-xs text-muted-foreground">Informe onde você quer ir</p>
          </div>
          <button className="h-10 w-10 grid place-items-center rounded-full bg-secondary">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Origin / Destination card */}
        <div className="mt-4 rounded-2xl border border-border bg-surface p-3 space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-success ring-4 ring-success/20 shrink-0" />
            <input
              defaultValue={currentLocation}
              readOnly
              className="flex-1 bg-transparent outline-none text-sm font-medium"
            />
            <button
              onClick={() => {}}
              className="h-8 w-8 grid place-items-center rounded-full bg-secondary shrink-0"
            >
              <Navigation className="h-3.5 w-3.5 text-primary" />
            </button>
          </div>
          <div className="border-t border-border" />
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary shrink-0" />
            <input
              placeholder="Para onde você vai?"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                if (!e.target.value) {
                  setSelectedPlace(null);
                  setEstimatedDistance(null);
                  setEstimatedTime(null);
                  setRoute(false);
                }
              }}
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <button
              onClick={handleSwap}
              className="h-8 w-8 grid place-items-center rounded-full bg-secondary shrink-0"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Suggestions list */}
        <p className="mt-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Sugestões
        </p>
        <ul className="mt-2 divide-y divide-border">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => handleSelectPlace(s)}
                className={`w-full flex items-center gap-3 py-3 text-left transition-colors ${
                  selectedPlace?.id === s.id ? "bg-accent/60 -mx-2 px-2 rounded-xl" : ""
                }`}
              >
                <span
                  className={`h-9 w-9 grid place-items-center rounded-xl shrink-0 ${
                    selectedPlace?.id === s.id
                      ? "bg-primary text-white"
                      : "bg-accent text-accent-foreground"
                  }`}
                >
                  {s.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                  {s.distance}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Map with route */}
        {selectedPlace && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-5"
          >
            <MapCanvas
              height={200}
              route
              pins={[
                { x: 20, y: 85, kind: "user", label: "Você" },
                {
                  x: selectedPlace.x,
                  y: selectedPlace.y,
                  kind: "place",
                  label: selectedPlace.name,
                },
              ]}
              className="rounded-2xl border border-border"
            />
          </motion.div>
        )}

        {/* Distance & Time card */}
        {estimatedDistance && estimatedTime && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-4 rounded-2xl border border-border bg-surface p-4 flex items-center gap-4"
          >
            <div className="flex-1 text-center">
              <div className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">
                Distância
              </div>
              <div className="font-display text-lg font-bold text-foreground mt-0.5">
                {estimatedDistance}
              </div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex-1 text-center">
              <div className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">
                Tempo estimado
              </div>
              <div className="font-display text-lg font-bold text-foreground mt-0.5">
                {estimatedTime}
              </div>
            </div>
          </motion.div>
        )}

        {/* Confirm button */}
        <button
          disabled={!selectedPlace}
          onClick={() => nav({ to: "/matching" })}
          className="mt-5 w-full rounded-full bg-gradient-brand py-4 text-white font-semibold shadow-elegant disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          Confirmar destino
        </button>
      </div>
    </div>
  );
}
