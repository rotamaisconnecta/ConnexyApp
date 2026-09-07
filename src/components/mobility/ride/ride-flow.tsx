import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import {
  DEMO_ORIGIN,
  MOCK_DRIVER,
  CATEGORY_INFO,
  PICKUP_CHIPS,
  destinationToGeo,
} from "./ride-data";
import { RIDE_CATEGORIES, estimateDemoFare } from "@/lib/mobility/demo-fare";
import {
  createStop,
  removeStop,
  estimateRouteDistance,
  estimateRouteDuration,
  type RouteStop,
} from "@/lib/mobility/route-utils";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import type { FlowState, PaymentOption } from "./ride-flow-types";
import type { RideCategory } from "@/lib/mobility/demo-fare";

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
  onBackToHome,
}: {
  origin?: GeoLocation;
  destination?: GeoLocation | null;
  initialStops?: RouteStop[];
  source?: string | null;
  companionLabel?: string;
  onBackToHome?: () => void;
}) {
  const nav = useNavigate();
  const driver = MOCK_DRIVER;

  const [flowState, setFlowState] = useState<FlowState>(initialDestination ? "rota" : "solicitar");
  const [destination, setDestination] = useState<GeoLocation | null>(initialDestination);
  const [stops, setStops] = useState<RouteStop[]>(initialStops);
  const [pickupLabel, setPickupLabel] = useState<string>(PICKUP_CHIPS[0].label);
  const [pickupPoint, setPickupPoint] = useState<string>(PICKUP_CHIPS[0].active);
  const [category, setCategory] = useState<RideCategory>("connexy");
  const [payment, setPayment] = useState<PaymentOption>("pix");
  const [pixConfirmed, setPixConfirmed] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingTags, setRatingTags] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState("");
  const [buscandoMessageIdx, setBuscandoMessageIdx] = useState(0);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);

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
        return `${driver.name} a caminho`;
      case "chegou":
        return `${driver.name} chegou`;
      case "emviagem":
        return `Indo para ${stops[currentStopIdx]?.label ?? destination?.label ?? "destino"}`;
      case "parada":
        return `Parada ${currentStopIdx + 1} de ${stops.length}`;
      case "chegada":
        return "Você chegou";
      case "avaliacao":
        return "Avalie sua viagem";
      case "conclusao":
        return "Obrigado por viajar com o Connexy";
      default:
        return "";
    }
  }, [flowState, buscandoMessageIdx, driver.name, destination, stops, currentStopIdx]);

  const pulseActive = ["buscando", "encontrado", "chegando"].includes(flowState);
  const canGoBack = ["rota", "embarque", "categoria"].includes(flowState);

  useEffect(() => {
    clearTimers();
    switch (flowState) {
      case "buscando":
        intervalRef.current = setInterval(
          () => setBuscandoMessageIdx((prev) => (prev + 1) % BUSCANDO_MESSAGES.length),
          1800,
        );
        timerRef.current = setTimeout(() => setFlowState("encontrado"), 2500);
        break;
      case "encontrado":
        timerRef.current = setTimeout(() => setFlowState("chegando"), 4000);
        break;
      case "chegando":
        timerRef.current = setTimeout(() => setFlowState("chegou"), 3000);
        break;
      case "emviagem":
        timerRef.current = setTimeout(() => {
          if (currentStopIdx < stops.length) {
            setFlowState("parada");
          } else {
            setFlowState("chegada");
          }
        }, 5000);
        break;
      default:
        break;
    }
    return () => clearTimers();
  }, [flowState, currentStopIdx, stops.length, clearTimers]);

  const goBack = useCallback(() => {
    switch (flowState) {
      case "rota":
        setFlowState("solicitar");
        break;
      case "embarque":
        setFlowState("rota");
        break;
      case "categoria":
        setFlowState("embarque");
        break;
      default:
        break;
    }
  }, [flowState]);

  const handleProceedSolicitar = useCallback(() => {
    if (destination) setFlowState("rota");
  }, [destination]);

  const handleAddStop = useCallback(() => {
    const newStop = createStop(
      { lat: -23.55, lng: -46.64, label: "Nova parada" },
      "Nova parada",
      stops.length + 1,
    );
    setStops((prev) => [...prev, newStop]);
  }, [stops.length]);

  const handleAddSuggestion = useCallback(
    (label: string, address: string) => {
      const newStop = createStop(
        { lat: -23.55, lng: -46.64, label: address },
        label,
        stops.length + 1,
      );
      setStops((prev) => [...prev, newStop]);
    },
    [stops.length],
  );

  const handleRemoveStop = useCallback((id: string) => {
    setStops((prev) => removeStop(prev, id));
  }, []);

  const handleEditStop = useCallback((id: string, label: string) => {
    setStops((prev) =>
      prev.map((stop) =>
        stop.id === id ? { ...stop, label, location: { ...stop.location, label } } : stop,
      ),
    );
  }, []);

  const handleMoveStops = useCallback((next: RouteStop[]) => {
    setStops(next);
  }, []);

  const handleProceedRota = useCallback(() => {
    if (destination) setFlowState("embarque");
  }, [destination]);

  const handleRequestRide = useCallback(() => {
    setFlowState("buscando");
    setBuscandoMessageIdx(0);
  }, []);

  const handleStartRide = useCallback(() => {
    setCurrentStopIdx(0);
    setFlowState("emviagem");
  }, []);

  const handleContinueStop = useCallback(() => {
    if (currentStopIdx + 1 < stops.length) {
      setCurrentStopIdx((prev) => prev + 1);
      setFlowState("emviagem");
    } else {
      setCurrentStopIdx(stops.length);
      setFlowState("chegada");
    }
  }, [currentStopIdx, stops.length]);

  const handleContinueArrival = useCallback(() => {
    setFlowState("avaliacao");
  }, []);

  const handleSimulatePix = useCallback(() => setPixConfirmed(true), []);

  const handleSendRating = useCallback(() => {
    setFlowState("conclusao");
  }, []);

  const handleGoHome = useCallback(() => {
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
            onPickDestination={(dest) => setDestination(dest)}
            onClearDestination={() => setDestination(null)}
            onProceed={handleProceedSolicitar}
            companionLabel={companionLabel}
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
            source={source}
          />
        );
      case "embarque":
        return (
          <PickupPanel
            pickupLabel={pickupLabel}
            pickupPoint={pickupPoint}
            onPickupChip={(chip) => {
              setPickupLabel(chip);
              const found = PICKUP_CHIPS.find((c) => c.label === chip);
              setPickupPoint(found?.active ?? chip);
            }}
            onConfirm={() => setFlowState("categoria")}
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
            onCategory={setCategory}
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
            onCancel={() => nav({ to: "/home" })}
          />
        );
      case "encontrado":
      case "chegando":
      case "chegou":
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
          />
        );
      case "parada":
        return (
          <StopPanel
            current={currentStopIdx + 1}
            total={stops.length}
            onContinue={handleContinueStop}
          />
        );
      case "emviagem":
        return (
          <ActiveRidePanel
            driver={driver}
            destination={destination ?? origin}
            stopLabel={stops[currentStopIdx]?.label}
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
            pixConfirmed={pixConfirmed}
            onSimulatePix={handleSimulatePix}
            onContinue={handleContinueArrival}
            routeMeta={routeMeta}
            destination={destination ?? origin}
          />
        );
      case "avaliacao":
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
            onSkip={() => setFlowState("conclusao")}
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
            showVehicle ? { t: vehicleT, path: vehiclePath, label: driver.vehicle.plate } : null
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
          setPayment(p);
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
          setFlowState("rota");
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
          setDestination(dest);
          setShowChangeDestOverlay(false);
          setFlowState("rota");
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
        reason="Tem certeza que deseja cancelar esta viagem?"
        onConfirm={() => {
          setShowCancelConfirm(false);
          nav({ to: "/home" });
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
            <strong>Nome:</strong> {driver.name}
          </p>
          <p>
            <strong>Veículo:</strong> {driver.vehicle.name} {driver.vehicle.color}
          </p>
          <p>
            <strong>Placa:</strong> {driver.vehicle.plate}
          </p>
          <p>
            <strong>Avaliação:</strong> {driver.rating} ({driver.totalRides} corridas)
          </p>
        </div>
      </InfoModal>
      <MessageModal open={showMessage} onClose={() => setShowMessage(false)} driver={driver} />
      <CallModal open={showCall} onClose={() => setShowCall(false)} driver={driver} />
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
