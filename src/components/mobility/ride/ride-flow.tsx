import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { RideMap } from "./ride-map";
import { RideCapsule, RoundIconButton } from "./ride-capsule";
import {
  SolicitarPanel,
  RouteEditorPanel,
  PickupPanel,
  CategoryPanel,
} from "./ride-request-panels";
import {
  SearchingPanel,
  DriverPanel,
  ActiveRidePanel,
  StopPanel,
  ArrivalPanel,
  RatingPanel,
  FinalPanel,
  CancelledPanel,
} from "./ride-live-panels";
import {
  PaymentOverlay,
  SafetyOverlay,
  AlterarOverlay,
  DetailsOverlay,
  ChangeDestinationOverlay,
  ShareSheet,
  CancelConfirmModal,
  InfoModal,
  MessageModal,
  CallModal,
  RouteStopsSheet,
} from "./ride-overlays";
import { DEMO_ORIGIN, MOCK_DRIVER, PICKUP_CHIPS, CATEGORY_INFO } from "./ride-data";
import { estimateDemoFare, RIDE_CATEGORIES, type RideCategory } from "@/lib/mobility/demo-fare";
import {
  createStop,
  removeStop,
  estimateRouteDistance,
  estimateRouteDuration,
  type RouteStop,
} from "@/lib/mobility/route-utils";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import type { TripStatus } from "@/lib/mobility/trip/trip-types";
import { useTrip } from "@/hooks/use-trip";
import { usePassengerDispatch } from "@/hooks/use-dispatch";
import {
  createTrip,
  patchTrip,
  transition,
  completeTrip,
  resetTrip,
  getTrip,
} from "@/lib/mobility/trip/trip-store";
import { cancelPassengerTrip } from "@/lib/mobility/dispatch/dispatcher";

const BUSCANDO_MESSAGES = [
  "Procurando motorista mais próximo",
  "Quase lá...",
  "Encontrando viagem ideal",
] as const;

export function RideFlow({
  origin = DEMO_ORIGIN,
  destination: initialDestination = null,
  initialStops = [],
  source,
  companionLabel,
  seedInitial = false,
  onBackToHome,
}: {
  origin?: GeoLocation;
  destination?: GeoLocation | null;
  initialStops?: RouteStop[];
  source?: string | null;
  companionLabel?: string;
  seedInitial?: boolean;
  onBackToHome?: () => void;
}) {
  const nav = useNavigate();
  const trip = useTrip();
  usePassengerDispatch(trip);
  const flowState: TripStatus = trip?.status ?? "solicitar";

  const [buscandoMessageIdx, setBuscandoMessageIdx] = useState(0);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingTags, setRatingTags] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState("");

  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);
  const [showSafetyOverlay, setShowSafetyOverlay] = useState(false);
  const [showAlterarOverlay, setShowAlterarOverlay] = useState(false);
  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false);
  const [showChangeDestOverlay, setShowChangeDestOverlay] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showRouteStops, setShowRouteStops] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    if (seedInitial) {
      const current = getTrip();
      if (!current || current.status === "conclusao" || current.status === "cancelada") {
        createTrip({
          origin,
          destination: initialDestination,
          stops: initialStops,
          source,
          companionLabel,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedInitial]);

  const driver = useMemo(() => trip?.driver ?? null, [trip]);
  const destination = useMemo(() => trip?.destination ?? null, [trip]);
  const stops = useMemo(() => trip?.stops ?? [], [trip]);
  const category = trip?.category ?? "connexy";
  const payment = trip?.paymentMethod ?? "pix";

  const { distanceMeters, durationMinutes } = useMemo(() => {
    const points = [origin, ...stops.map((stop) => stop.location), destination ?? origin];
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += estimateRouteDistance(points[i - 1], points[i]);
    }
    total = Math.max(400, Math.round(total));
    const duration = estimateRouteDuration(total) + stops.length * 3;
    return { distanceMeters: total, durationMinutes: duration };
  }, [origin, stops, destination]);

  const fare = useMemo(
    () => estimateDemoFare(category, distanceMeters, durationMinutes, stops.length),
    [category, distanceMeters, durationMinutes, stops.length],
  );
  const categoryLabel = CATEGORY_INFO[category].label;

  const routeMeta = useMemo(
    () => ({
      distance: `${(distanceMeters / 1000).toFixed(1).replace(".", ",")} km`,
      duration: `${durationMinutes} min`,
    }),
    [distanceMeters, durationMinutes],
  );

  const vehicleT = (() => {
    switch (flowState) {
      case "encontrado":
        return 0.2;
      case "chegando":
        return 0.6;
      case "chegou":
        return 1;
      case "emviagem":
        return 0.5;
      case "parada":
        return 0.7;
      case "chegada":
        return 1;
      default:
        return 0;
    }
  })();
  const vehiclePath: "approach" | "main" =
    flowState === "buscando" ||
    flowState === "encontrado" ||
    flowState === "chegando" ||
    flowState === "chegou"
      ? "approach"
      : "main";
  const showVehicle = [
    "encontrado",
    "chegando",
    "chegou",
    "emviagem",
    "parada",
    "chegada",
  ].includes(flowState);

  const capsuleText = useMemo(() => {
    const currentStopIndex = trip?.currentStopIndex ?? 0;
    switch (flowState) {
      case "solicitar":
      case "rota":
        return "Monte sua rota";
      case "embarque":
        return "Confirme seu embarque";
      case "categoria":
        return "Escolha sua viagem";
      case "buscando":
        return BUSCANDO_MESSAGES[buscandoMessageIdx];
      case "encontrado":
      case "chegando":
        return driver ? `${driver.name} a caminho` : "Motorista a caminho";
      case "chegou":
        return driver ? `${driver.name} chegou` : "Motorista chegou";
      case "emviagem":
        return `Indo para ${stops[currentStopIndex]?.label ?? destination?.label ?? "destino"}`;
      case "parada":
        return `Parada ${currentStopIndex + 1} de ${stops.length}`;
      case "chegada":
        return "Você chegou";
      case "avaliacao":
        return "Avalie sua viagem";
      case "conclusao":
        return "Obrigado por viajar com o Connexy";
      default:
        return "";
    }
  }, [flowState, buscandoMessageIdx, driver, destination, stops, trip?.currentStopIndex]);

  const pulseActive = ["buscando", "encontrado", "chegando"].includes(flowState);
  const canGoBack = ["rota", "embarque", "categoria"].includes(flowState);

  useEffect(() => {
    clearTimers();
    if (!trip) return;
    const currentStopIndex = trip.currentStopIndex;
    switch (trip.status) {
      case "buscando":
        intervalRef.current = setInterval(
          () => setBuscandoMessageIdx((prev) => (prev + 1) % BUSCANDO_MESSAGES.length),
          1800,
        );
        /* A atribuição do motorista vem do dispatcher (passenger→dispatcher→driver). */
        break;
      case "encontrado":
        timerRef.current = setTimeout(() => transition("chegando"), 4000);
        break;
      case "chegando":
        timerRef.current = setTimeout(() => transition("chegou"), 3000);
        break;
      case "emviagem":
        timerRef.current = setTimeout(() => {
          if (currentStopIndex < trip.stops.length) {
            transition("parada");
          } else {
            transition("chegada");
          }
        }, 5000);
        break;
      default:
        break;
    }
    return () => clearTimers();
  }, [trip, clearTimers]);

  const goBack = useCallback(() => {
    if (!trip) return;
    switch (flowState) {
      case "rota":
        transition("solicitar");
        break;
      case "embarque":
        transition("rota");
        break;
      case "categoria":
        transition("embarque");
        break;
      default:
        break;
    }
  }, [flowState, trip]);

  const handleProceedSolicitar = useCallback(() => {
    if (destination) transition("rota");
  }, [destination]);

  const handleAddStop = useCallback(() => {
    const newStop = createStop(
      { lat: -23.55, lng: -46.64, label: "Nova parada" },
      "Nova parada",
      stops.length + 1,
    );
    patchTrip({ stops: [...stops, newStop] });
  }, [stops]);

  const handleAddSuggestion = useCallback(
    (label: string, address: string) => {
      const newStop = createStop(
        { lat: -23.55, lng: -46.64, label: address },
        label,
        stops.length + 1,
      );
      patchTrip({ stops: [...stops, newStop] });
    },
    [stops],
  );

  const handleRemoveStop = useCallback(
    (id: string) => {
      patchTrip({ stops: removeStop(trip?.stops ?? [], id) });
    },
    [trip?.stops],
  );

  const handleEditStop = useCallback(
    (id: string, label: string) => {
      patchTrip({
        stops: (trip?.stops ?? []).map((stop) =>
          stop.id === id ? { ...stop, label, location: { ...stop.location, label } } : stop,
        ),
      });
    },
    [trip?.stops],
  );

  const handleMoveStops = useCallback((next: RouteStop[]) => {
    patchTrip({ stops: next });
  }, []);

  const handleProceedRota = useCallback(() => {
    if (destination) transition("embarque");
  }, [destination]);

  const handleRequestRide = useCallback(() => {
    patchTrip({ distanceMeters, durationMinutes, estimatedFare: fare });
    transition("buscando");
    setBuscandoMessageIdx(0);
  }, [distanceMeters, durationMinutes, fare]);

  const handleStartRide = useCallback(() => {
    patchTrip({ currentStopIndex: 0 });
    transition("emviagem");
  }, []);

  const handleContinueStop = useCallback(() => {
    const currentStopIndex = trip?.currentStopIndex ?? 0;
    const totalStops = trip?.stops.length ?? 0;
    if (currentStopIndex + 1 < totalStops) {
      patchTrip({ currentStopIndex: currentStopIndex + 1 });
      transition("emviagem");
    } else {
      patchTrip({ currentStopIndex: totalStops });
      transition("chegada");
    }
  }, [trip?.currentStopIndex, trip?.stops.length]);

  const handleContinueArrival = useCallback(() => {
    transition("avaliacao");
  }, []);

  const handleSimulatePix = useCallback(() => {
    patchTrip({ paymentConfirmed: true });
  }, []);

  const handleSendRating = useCallback(() => {
    completeTrip({
      stars: ratingStars,
      tags: ratingTags,
      comment: ratingComment,
      createdAt: new Date().toISOString(),
    });
  }, [ratingStars, ratingTags, ratingComment]);

  const handleSkipRating = useCallback(() => {
    completeTrip();
  }, []);

  const handleGoHome = useCallback(() => {
    const status = trip?.status;
    if (status === "conclusao" || status === "cancelada") resetTrip();
    if (onBackToHome) onBackToHome();
    else nav({ to: "/home" });
  }, [trip?.status, onBackToHome, nav]);

  const handleCancelRide = useCallback(() => {
    cancelPassengerTrip();
    if (onBackToHome) onBackToHome();
    else nav({ to: "/home" });
  }, [onBackToHome, nav]);

  const handleToggleTag = useCallback((tag: string) => {
    setRatingTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }, []);

  const renderPanel = () => {
    switch (flowState) {
      case "solicitar":
        return (
          <SolicitarPanel
            destination={destination}
            onPickDestination={(dest) => patchTrip({ destination: dest })}
            onClearDestination={() => patchTrip({ destination: null })}
            onProceed={handleProceedSolicitar}
            companionLabel={companionLabel ?? trip?.companionLabel}
          />
        );
      case "rota":
        if (!destination) return null;
        return (
          <RouteEditorPanel
            originLabel={origin.label}
            destination={destination}
            stops={stops}
            onAddStop={handleAddStop}
            onAddSuggestion={handleAddSuggestion}
            onRemoveStop={handleRemoveStop}
            onEditStop={handleEditStop}
            onMoveStops={handleMoveStops}
            onProceed={handleProceedRota}
            routeMeta={routeMeta}
            source={trip?.source ?? source}
          />
        );
      case "embarque":
        return (
          <PickupPanel
            pickupLabel={trip?.pickupLabel ?? PICKUP_CHIPS[0].label}
            pickupPoint={trip?.pickupPoint ?? PICKUP_CHIPS[0].active}
            onPickupChip={(chip) => {
              const found = PICKUP_CHIPS.find((c) => c.label === chip);
              patchTrip({ pickupLabel: chip, pickupPoint: found?.active ?? chip });
            }}
            onConfirm={() => transition("categoria")}
          />
        );
      case "categoria": {
        const fares = {} as Record<RideCategory, number>;
        const etaMap = {} as Record<RideCategory, number>;
        for (const cat of RIDE_CATEGORIES) {
          fares[cat] = estimateDemoFare(cat, distanceMeters, durationMinutes, stops.length);
          etaMap[cat] = CATEGORY_INFO[cat].etaMinutes;
        }
        return (
          <CategoryPanel
            category={category}
            onCategory={(next) => patchTrip({ category: next })}
            payment={payment}
            onPayment={() => setShowPaymentOverlay(true)}
            fares={fares}
            etaMap={etaMap}
            routeMeta={routeMeta}
            onRequest={handleRequestRide}
          />
        );
      }
      case "buscando":
        return (
          <SearchingPanel
            message={BUSCANDO_MESSAGES[buscandoMessageIdx]}
            categoryLabel={categoryLabel}
            fare={fare}
            payment={payment}
            onCancel={() => setShowCancelConfirm(true)}
          />
        );
      case "encontrado":
      case "chegando":
      case "chegou":
        if (!driver) return null;
        return (
          <DriverPanel
            state={flowState as "encontrado" | "chegando" | "chegou"}
            driver={driver}
            etaMinutes={
              flowState === "chegou"
                ? 0
                : flowState === "chegando"
                  ? 1
                  : CATEGORY_INFO[category].etaMinutes
            }
            categoryLabel={categoryLabel}
            fare={fare}
            payment={payment}
            onStartRide={handleStartRide}
            onMessage={() => setShowMessage(true)}
            onCall={() => setShowCall(true)}
            onSafety={() => setShowSafetyOverlay(true)}
            onShare={() => setShowShareSheet(true)}
            onCancel={() => setShowCancelConfirm(true)}
          />
        );
      case "parada":
        return (
          <StopPanel
            current={(trip?.currentStopIndex ?? 0) + 1}
            total={stops.length}
            onContinue={handleContinueStop}
          />
        );
      case "emviagem":
        if (!driver) return null;
        return (
          <ActiveRidePanel
            driver={driver}
            destination={destination ?? origin}
            stopLabel={stops[trip?.currentStopIndex ?? 0]?.label}
            etaMinutes={durationMinutes}
            onSafety={() => setShowSafetyOverlay(true)}
            onShare={() => setShowShareSheet(true)}
            onRoute={() => setShowRouteStops(true)}
            onMore={() => setShowAlterarOverlay(true)}
          />
        );
      case "chegada":
        return (
          <ArrivalPanel
            categoryLabel={categoryLabel}
            fare={fare}
            payment={payment}
            pixConfirmed={trip?.paymentConfirmed ?? false}
            onSimulatePix={handleSimulatePix}
            onContinue={handleContinueArrival}
            routeMeta={routeMeta}
            destination={destination ?? origin}
          />
        );
      case "avaliacao":
        if (!driver) return null;
        return (
          <RatingPanel
            driver={driver}
            categoryLabel={categoryLabel}
            stars={ratingStars}
            onStars={setRatingStars}
            tags={ratingTags}
            onTag={handleToggleTag}
            comment={ratingComment}
            onComment={setRatingComment}
            onSend={handleSendRating}
            onSkip={handleSkipRating}
          />
        );
      case "conclusao":
        return (
          <FinalPanel
            originLabel={origin.label}
            destination={destination ?? origin}
            routeMeta={routeMeta}
            fare={fare}
            payment={payment}
            onHome={handleGoHome}
          />
        );
      case "cancelada":
        return (
          <CancelledPanel
            byDriver={trip?.cancelledBy === "driver"}
            originLabel={origin.label}
            destination={destination ?? origin}
            onHome={handleGoHome}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white">
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <RideMap
          stops={stops}
          destinationLabel={destination?.label ?? "Destino"}
          originLabel={origin.label}
          vehicle={
            showVehicle && driver
              ? { t: vehicleT, path: vehiclePath, label: driver.vehicle.plate }
              : null
          }
          radar={flowState === "buscando"}
          interactive={flowState === "embarque"}
          pickupFocus={flowState === "embarque"}
        />
        <RideCapsule text={capsuleText} pulse={pulseActive} />
        {canGoBack && (
          <RoundIconButton
            label="Voltar"
            icon={ArrowLeft}
            onClick={goBack}
            className="!absolute left-4 top-14 z-40"
          />
        )}
        {renderPanel()}
      </div>

      {/* Overlays */}
      <PaymentOverlay
        open={showPaymentOverlay}
        onClose={() => setShowPaymentOverlay(false)}
        payment={payment}
        onPick={(p) => {
          patchTrip({ paymentMethod: p });
          setShowPaymentOverlay(false);
        }}
      />
      <SafetyOverlay
        open={showSafetyOverlay}
        onClose={() => setShowSafetyOverlay(false)}
        onShare={() => {
          setShowSafetyOverlay(false);
          setShowShareSheet(true);
        }}
        onDriverInfo={() => {
          setShowSafetyOverlay(false);
          setShowDriverInfo(true);
        }}
        onHelp={() => {
          setShowSafetyOverlay(false);
          setShowHelp(true);
        }}
        onEmergency={() => {
          setShowSafetyOverlay(false);
          setShowEmergency(true);
        }}
      />
      <AlterarOverlay
        open={showAlterarOverlay}
        onClose={() => setShowAlterarOverlay(false)}
        onAddStop={() => {
          setShowAlterarOverlay(false);
          transition("rota");
        }}
        onChangeDest={() => {
          setShowAlterarOverlay(false);
          setShowChangeDestOverlay(true);
        }}
        onPayment={() => {
          setShowAlterarOverlay(false);
          setShowPaymentOverlay(true);
        }}
        onDetails={() => {
          setShowAlterarOverlay(false);
          setShowDetailsOverlay(true);
        }}
        onCancelRide={() => {
          setShowAlterarOverlay(false);
          setShowCancelConfirm(true);
        }}
      />
      <DetailsOverlay
        open={showDetailsOverlay}
        onClose={() => setShowDetailsOverlay(false)}
        state={flowState}
        distance={routeMeta.distance}
        duration={routeMeta.duration}
        fare={formatPrice(fare)}
        fareColor={false}
        categoryLabel={categoryLabel}
        payment={payment}
      />
      <ChangeDestinationOverlay
        open={showChangeDestOverlay}
        onClose={() => setShowChangeDestOverlay(false)}
        onConfirm={(dest) => {
          patchTrip({ destination: dest });
          setShowChangeDestOverlay(false);
          transition("rota");
        }}
      />
      <ShareSheet
        open={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        onNative={() => setShowShareSheet(false)}
        onCopy={() => {
          try {
            navigator.clipboard?.writeText?.("Estou viajando com o Connexy 🟡");
          } catch {
            /* ignore */
          }
        }}
      />
      <CancelConfirmModal
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Cancelar corrida?"
        dismissLabel="Continuar viagem"
        confirmLabel="Cancelar corrida"
        reason="Esta ação encerra a corrida e libera o motorista. Sem cobrança na fase demo."
        onConfirm={() => {
          setShowCancelConfirm(false);
          handleCancelRide();
        }}
      />
      <InfoModal
        open={showEmergency}
        onClose={() => setShowEmergency(false)}
        title="Emergência"
        primaryLabel="Ligar 190"
        primaryTone="red"
      >
        Acione o serviço de emergência imediatamente. Em caso de perigo real, ligue 190.
      </InfoModal>
      <InfoModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title="Central de ajuda"
        primaryLabel="Fechar"
      >
        Em caso de problema com a viagem, utilize as opções de segurança ou cancele a corrida.
      </InfoModal>
      <InfoModal
        open={showDriverInfo}
        onClose={() => setShowDriverInfo(false)}
        title="Dados do motorista"
        primaryLabel="Fechar"
      >
        <div className="mt-2 flex flex-col gap-2 text-left">
          <p>
            <strong>Nome:</strong> {driver?.name}
          </p>
          <p>
            <strong>Veículo:</strong> {driver?.vehicle.name} {driver?.vehicle.color}
          </p>
          <p>
            <strong>Placa:</strong> {driver?.vehicle.plate}
          </p>
          <p>
            <strong>Avaliação:</strong> {driver?.rating} ({driver?.totalRides} corridas)
          </p>
        </div>
      </InfoModal>
      <MessageModal
        open={showMessage}
        onClose={() => setShowMessage(false)}
        driver={driver ?? MOCK_DRIVER}
      />
      <CallModal
        open={showCall}
        onClose={() => setShowCall(false)}
        driver={driver ?? MOCK_DRIVER}
      />
      <RouteStopsSheet
        open={showRouteStops}
        onClose={() => setShowRouteStops(false)}
        originLabel={origin.label}
        stops={stops.map((stop, idx) => ({ label: stop.label, order: idx + 1 }))}
        destination={destination ?? origin}
      />
    </div>
  );
}
