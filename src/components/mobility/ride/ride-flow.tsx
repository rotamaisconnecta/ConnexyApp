import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { RideMap, type RideRouteStatus } from "./ride-map";
import { RideCapsule, RoundIconButton } from "./ride-capsule";
import { RideLandingChrome } from "./ride-landing";
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
  PickFriendOverlay,
} from "./ride-overlays";
import { RidePlacePickerOverlay } from "./ride-place-picker";
import { DEMO_ORIGIN, MOCK_DRIVER, PICKUP_CHIPS, CATEGORY_INFO } from "./ride-data";
import { CURRENT_RIDE_ORIGIN_LABEL, resolveRideOrigin } from "@/lib/mobility/ride-request-context";
import { listRideExplorePins, type RideExploreKind } from "@/lib/mobility/ride-explore-pins";
import { estimateDemoFare, RIDE_CATEGORIES, type RideCategory } from "@/lib/mobility/demo-fare";
import {
  categoriesFromRideOptions,
  type RideChooseOption,
} from "@/lib/mobility/ride-choose-options";
import {
  addStop,
  computeTripRouteMeta,
  formatRouteDistance,
  formatRouteDuration,
  MAX_ROUTE_STOPS,
  removeStop,
  replaceStop,
  type RouteStop,
} from "@/lib/mobility/route-utils";
import { formatPrice } from "@/lib/mobility/ride-pricing";
import type { GeoLocation } from "@/lib/mobility/ride-types";
import type { TripStatus } from "@/lib/mobility/trip/trip-types";
import { useTrip } from "@/hooks/use-trip";
import { usePassengerDispatch } from "@/hooks/use-dispatch";
import {
  startOrUpdatePlanningTrip,
  patchTrip,
  transition,
  completeTrip,
  resetTrip,
  getTrip,
} from "@/lib/mobility/trip/trip-store";
import { cancelPassengerTrip } from "@/lib/mobility/dispatch/dispatcher";
import { tripPaymentStatus } from "@/lib/mobility/payment";
import { toast } from "sonner";
import { useDemoIdentity } from "@/lib/demo/demo-identity";
import { useOutingInviteVersion } from "@/lib/marketplace/outing-invites";
import { occupancyForCategory } from "@/lib/mobility/ride-occupancy";
import {
  cancelRideFriend,
  cancelRideFriendByPerson,
  listRideFriendCandidates,
  listRideFriendInvites,
  occupancyForCurrentTrip,
  respondToRideFriendInvite,
  sendRideFriendInvite,
} from "@/lib/mobility/ride-companions";

const BUSCANDO_MESSAGES = [
  "Procurando motorista mais próximo",
  "Quase lá...",
  "Encontrando viagem ideal",
] as const;

export function RideFlow({
  origin: originProp = DEMO_ORIGIN,
  destination: initialDestination = null,
  initialStops = [],
  source,
  companionLabel,
  seedInitial = false,
  onBackToHome,
}: {
  origin?: GeoLocation | null;
  destination?: GeoLocation | null;
  initialStops?: RouteStop[];
  source?: string | null;
  companionLabel?: string;
  seedInitial?: boolean;
  onBackToHome?: () => void;
}) {
  const nav = useNavigate();
  const trip = useTrip();
  const identity = useDemoIdentity();
  const outingVersion = useOutingInviteVersion();
  usePassengerDispatch(trip);
  const flowState: TripStatus = trip?.status ?? "solicitar";
  const origin = trip?.origin ?? originProp;

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
  const [showPickFriend, setShowPickFriend] = useState(false);
  const [placePicker, setPlacePicker] = useState<
    null | { target: "origin" } | { target: "destination" } | { target: "stop" } | { target: "edit-stop"; id: string }
  >(null);
  const [routeStatus, setRouteStatus] = useState<RideRouteStatus>("idle");
  const [routeRetry, setRouteRetry] = useState(0);
  const [destEditorOpen, setDestEditorOpen] = useState(false);
  const [exploreKind, setExploreKind] = useState<RideExploreKind>("motoristas");
  const [recenterNonce, setRecenterNonce] = useState(0);

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
    if (!seedInitial) return;
    if (!originProp) return;
    startOrUpdatePlanningTrip({
      origin: originProp,
      destination: initialDestination,
      stops: initialStops,
      source,
      companionLabel,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedInitial]);

  const driver = useMemo(() => trip?.driver ?? null, [trip]);
  const destination = useMemo(() => trip?.destination ?? null, [trip]);
  const displayDestination = destination ?? origin ?? DEMO_ORIGIN;
  const stops = useMemo(() => trip?.stops ?? [], [trip]);
  const explorePins = useMemo(
    () =>
      flowState === "solicitar"
        ? listRideExplorePins(exploreKind)
        : flowState === "categoria"
          ? listRideExplorePins("motoristas")
          : [],
    [flowState, exploreKind],
  );
  const showLanding = flowState === "solicitar" && !destEditorOpen && !placePicker;
  const showDestEditor = flowState === "solicitar" && destEditorOpen && !placePicker;
  const category = trip?.category ?? "connexy";
  const payment = trip?.paymentMethod ?? "pix";
  const occupancy = useMemo(() => {
    void outingVersion;
    if (trip) return occupancyForCurrentTrip(trip, identity.id);
    return occupancyForCategory(category, []);
  }, [trip, identity.id, outingVersion, category]);
  const friendInvites = useMemo(() => {
    void outingVersion;
    return trip ? listRideFriendInvites(identity.id, trip.id) : [];
  }, [trip, identity.id, outingVersion]);
  const friendCandidates = useMemo(() => {
    void outingVersion;
    return trip ? listRideFriendCandidates(identity.id, trip) : [];
  }, [trip, identity.id, outingVersion]);
  const canPickFriend = occupancy.available > 0;

  const { distanceMeters, durationMinutes, routeOk } = useMemo(() => {
    const meta = computeTripRouteMeta(origin, stops, destination);
    return {
      distanceMeters: meta.ok ? meta.distanceMeters : 0,
      durationMinutes: meta.ok ? meta.durationMinutes : 0,
      routeOk: meta.ok,
    };
  }, [origin, stops, destination]);

  const routeSignature = [
    origin?.lat,
    origin?.lng,
    destination?.lat,
    destination?.lng,
    stops.map((stop) => `${stop.id}:${stop.location.lat},${stop.location.lng}`).join("|"),
    routeRetry,
  ].join("::");

  useEffect(() => {
    if (!origin || !destination) {
      setRouteStatus("idle");
      return;
    }
    setRouteStatus("calculating");
    const timer = window.setTimeout(() => {
      setRouteStatus(routeOk ? "ready" : "error");
    }, 220);
    return () => window.clearTimeout(timer);
  }, [routeSignature, origin, destination, routeOk]);

  const fare = useMemo(
    () => estimateDemoFare(category, distanceMeters, durationMinutes, stops.length),
    [category, distanceMeters, durationMinutes, stops.length],
  );
  const categoryFares = useMemo(() => {
    const nextFares = {} as Record<RideCategory, number>;
    const nextEta = {} as Record<RideCategory, number>;
    for (const cat of RIDE_CATEGORIES) {
      nextFares[cat] = estimateDemoFare(cat, distanceMeters, durationMinutes, stops.length);
      nextEta[cat] = CATEGORY_INFO[cat].etaMinutes;
    }
    return { fares: nextFares, etaMap: nextEta };
  }, [distanceMeters, durationMinutes, stops.length]);
  const categoryLabel = CATEGORY_INFO[category].label;

  const routeMeta = useMemo(
    () => ({
      distance: formatRouteDistance(distanceMeters || 400),
      duration: formatRouteDuration(durationMinutes || 3),
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

  const ensureTrip = useCallback(
    (nextOrigin: GeoLocation, nextDestination = destination, nextStops = stops) => {
      if (trip) return trip;
      return startOrUpdatePlanningTrip({
        origin: nextOrigin,
        destination: nextDestination,
        stops: nextStops,
        source,
        companionLabel,
      });
    },
    [trip, destination, stops, source, companionLabel],
  );

  const handleChangeOrigin = useCallback(
    (next: GeoLocation) => {
      if (!trip) {
        ensureTrip(next);
        return;
      }
      patchTrip({ origin: next });
    },
    [trip, ensureTrip],
  );

  const handleChangeDestination = useCallback(
    (next: GeoLocation) => {
      const start = origin ?? resolveRideOrigin();
      if (!start) {
        toast.error("Defina a origem para calcular a rota.");
        return;
      }
      if (!trip) {
        startOrUpdatePlanningTrip({
          origin: start,
          destination: next,
          stops,
          source,
          companionLabel,
        });
        return;
      }
      patchTrip({ destination: next });
    },
    [origin, trip, stops, source, companionLabel],
  );

  const handleProceedSolicitar = useCallback(() => {
    if (origin && destination) {
      setDestEditorOpen(false);
      transition("rota");
    }
  }, [origin, destination]);

  const handleLandingRequest = useCallback(() => {
    if (origin && destination) {
      handleProceedSolicitar();
      return;
    }
    setDestEditorOpen(true);
  }, [origin, destination, handleProceedSolicitar]);

  const handleAddStop = useCallback(() => {
    if (stops.length >= MAX_ROUTE_STOPS) {
      toast.error(`Você pode adicionar até ${MAX_ROUTE_STOPS} paradas.`);
      return;
    }
    setPlacePicker({ target: "stop" });
  }, [stops.length]);

  const handleConfirmStop = useCallback(
    (place: GeoLocation) => {
      if (!origin) {
        toast.error("Defina a origem antes de adicionar paradas.");
        return;
      }
      ensureTrip(origin);
      const next = addStop(stops, place, place.label);
      if (next === stops) {
        toast.error(`Você pode adicionar até ${MAX_ROUTE_STOPS} paradas.`);
        return;
      }
      patchTrip({ stops: next });
    },
    [origin, stops, ensureTrip],
  );

  const handleRemoveStop = useCallback(
    (id: string) => {
      const current = trip?.stops ?? [];
      const stop = current.find((item) => item.id === id);
      if (trip && stop?.companionId) {
        const cancelled = cancelRideFriendByPerson(identity.id, trip.id, stop.companionId);
        if (cancelled) return;
      }
      patchTrip({ stops: removeStop(current, id) });
    },
    [trip, identity.id],
  );

  const handleOpenPickFriend = useCallback(() => {
    if (!canPickFriend) {
      toast.error("Capacidade máxima atingida");
      return;
    }
    const start = origin ?? resolveRideOrigin();
    if (!start) {
      toast.error("Defina a origem para pegar um amigo.");
      return;
    }
    ensureTrip(start);
    setShowPickFriend(true);
  }, [canPickFriend, origin, ensureTrip]);

  const handleInviteFriend = useCallback(
    (friendId: string, asDestination: boolean) => {
      const current = trip ?? getTrip();
      if (!current) {
        toast.error("Inicie a corrida para pegar um amigo.");
        return;
      }
      const invite = sendRideFriendInvite({
        trip: current,
        fromUserId: identity.id,
        friendId,
        asDestination,
      });
      if (!invite) {
        toast.error(occupancy.atLimit ? "Capacidade máxima atingida" : "Não foi possível convidar.");
        return;
      }
      toast.success("Convite enviado. A vaga fica reservada até a resposta.");
    },
    [trip, identity.id, occupancy.atLimit],
  );

  const handleRespondFriend = useCallback(
    (inviteId: string, friendId: string, accepted: boolean) => {
      const updated = respondToRideFriendInvite(inviteId, friendId, accepted);
      if (!updated) return;
      toast.success(
        accepted ? "Amigo adicionado. Rota e valor atualizados." : "Solicitação recusada. Vaga liberada.",
      );
    },
    [],
  );

  const handleCancelFriend = useCallback(
    (inviteId: string) => {
      const updated = cancelRideFriend(inviteId, identity.id);
      if (!updated) return;
      toast.success("Passageiro removido. Rota e valor atualizados.");
    },
    [identity.id],
  );

  const handleReplaceStop = useCallback(
    (id: string, place: GeoLocation) => {
      patchTrip({ stops: replaceStop(trip?.stops ?? [], id, place, place.label) });
    },
    [trip?.stops],
  );

  const handleMoveStops = useCallback((next: RouteStop[]) => {
    patchTrip({ stops: next.map((stop, index) => ({ ...stop, order: index + 1 })) });
  }, []);

  const handlePickedPlace = useCallback(
    (place: GeoLocation) => {
      if (!placePicker) return;
      if (placePicker.target === "origin") handleChangeOrigin(place);
      else if (placePicker.target === "destination") handleChangeDestination(place);
      else if (placePicker.target === "stop") handleConfirmStop(place);
      else handleReplaceStop(placePicker.id, place);
      setPlacePicker(null);
    },
    [placePicker, handleChangeOrigin, handleChangeDestination, handleConfirmStop, handleReplaceStop],
  );

  const handleProceedRota = useCallback(() => {
    if (destination) transition("embarque");
  }, [destination]);

  const handleRequestRide = useCallback(
    (selected: RideChooseOption[]) => {
      const acceptedCategories = categoriesFromRideOptions(selected);
      const primary = selected[0];
      if (!primary || acceptedCategories.length === 0) return;
      patchTrip({
        distanceMeters,
        durationMinutes,
        estimatedFare: primary.fare,
        category: primary.category,
        acceptedCategories,
      });
      transition("buscando");
      setBuscandoMessageIdx(0);
    },
    [distanceMeters, durationMinutes],
  );

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

  const handleSendRating = useCallback(() => {
    if (trip && tripPaymentStatus(trip) === "pending") {
      toast.error("Aguarde o motorista registrar o pagamento.");
      return;
    }
    completeTrip({
      stars: ratingStars,
      tags: ratingTags,
      comment: ratingComment,
      createdAt: new Date().toISOString(),
    });
  }, [trip, ratingStars, ratingTags, ratingComment]);

  const handleSkipRating = useCallback(() => {
    if (trip && tripPaymentStatus(trip) === "pending") {
      toast.error("Aguarde o motorista registrar o pagamento.");
      return;
    }
    completeTrip();
  }, [trip]);

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
        return null;
      case "rota":
        if (!destination) return null;
        return (
          <RouteEditorPanel
            origin={origin}
            destination={destination}
            stops={stops}
            onEditOrigin={() => setPlacePicker({ target: "origin" })}
            onEditDestination={() => setPlacePicker({ target: "destination" })}
            onAddStop={handleAddStop}
            onRemoveStop={handleRemoveStop}
            onEditStop={(id) => setPlacePicker({ target: "edit-stop", id })}
            onMoveStops={handleMoveStops}
            onProceed={handleProceedRota}
            routeMeta={routeMeta}
            routeStatus={routeStatus}
            source={trip?.source ?? source}
            onPickFriend={handleOpenPickFriend}
            pickFriendDisabled={!canPickFriend}
            occupancyLabel={occupancy.passengerLabel}
            vacancyLabel={occupancy.vacancyLabel}
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
      case "categoria":
        return (
          <CategoryPanel
            origin={origin}
            destination={destination}
            category={category}
            fares={categoryFares.fares}
            etaMap={categoryFares.etaMap}
            routeMeta={routeMeta}
            onRequest={handleRequestRide}
            onBack={goBack}
            onSafety={() => setShowSafetyOverlay(true)}
            onMore={() => setShowAlterarOverlay(true)}
            onPromos={() => setShowPaymentOverlay(true)}
            onEditOrigin={() => setPlacePicker({ target: "origin" })}
            onEditDestination={() => setPlacePicker({ target: "destination" })}
            onRecenter={() => setRecenterNonce((value) => value + 1)}
          />
        );
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
            onPickFriend={handleOpenPickFriend}
            pickFriendDisabled={!canPickFriend}
            pickFriendHint={occupancy.vacancyLabel}
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
            destination={displayDestination}
            stopLabel={stops[trip?.currentStopIndex ?? 0]?.label}
            etaMinutes={durationMinutes}
            distanceMeters={distanceMeters}
            fare={fare}
            payment={payment}
            onSafety={() => setShowSafetyOverlay(true)}
            onShare={() => setShowShareSheet(true)}
            onDetails={() => setShowDetailsOverlay(true)}
            onRecenter={() => setRecenterNonce((value) => value + 1)}
            onPickFriend={handleOpenPickFriend}
            pickFriendDisabled={!canPickFriend}
            pickFriendHint={occupancy.vacancyLabel}
          />
        );
      case "chegada":
        return (
          <ArrivalPanel
            categoryLabel={categoryLabel}
            fare={fare}
            payment={payment}
            paymentConfirmed={trip?.paymentConfirmed ?? false}
            paymentIssue={trip?.paymentIssue}
            onContinue={handleContinueArrival}
            routeMeta={routeMeta}
            destination={displayDestination}
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
            originLabel={origin?.label ?? CURRENT_RIDE_ORIGIN_LABEL}
            destination={displayDestination}
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
            originLabel={origin?.label ?? CURRENT_RIDE_ORIGIN_LABEL}
            destination={displayDestination}
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
        {!showDestEditor && (
          <RideMap
            origin={origin}
            destination={destination}
            stops={stops}
            destinationLabel={destination?.label ?? "Destino"}
            originLabel={origin?.label ?? CURRENT_RIDE_ORIGIN_LABEL}
            vehicle={
              showVehicle && driver
                ? { t: vehicleT, path: vehiclePath, label: driver.vehicle.plate }
                : null
            }
            radar={flowState === "buscando"}
            interactive={flowState === "embarque"}
            pickupFocus={flowState === "embarque"}
            compactPins={flowState === "categoria"}
            routeStatus={["solicitar", "rota"].includes(flowState) ? routeStatus : "ready"}
            exploreMode={flowState === "solicitar" && !destEditorOpen}
            explorePins={explorePins}
            recenterNonce={recenterNonce}
            onRetryRoute={() => setRouteRetry((value) => value + 1)}
            onMapPointSelect={placePicker ? handlePickedPlace : undefined}
            onOriginClick={
              flowState === "rota" || (flowState === "solicitar" && destEditorOpen)
                ? () => setPlacePicker({ target: "origin" })
                : undefined
            }
            onDestinationClick={
              flowState === "rota" || (flowState === "solicitar" && destEditorOpen)
                ? () => setPlacePicker({ target: "destination" })
                : undefined
            }
            onStopClick={
              flowState === "rota" || (flowState === "solicitar" && destEditorOpen)
                ? (id) => setPlacePicker({ target: "edit-stop", id })
                : undefined
            }
          />
        )}
        {showLanding && (
          <RideLandingChrome
            destination={destination}
            exploreKind={exploreKind}
            onExploreKind={setExploreKind}
            onOpenDestination={() => setDestEditorOpen(true)}
            onOpenFilters={() => setDestEditorOpen(true)}
            onRequestRide={handleLandingRequest}
            onRecenter={() => setRecenterNonce((value) => value + 1)}
          />
        )}
        {flowState !== "solicitar" && flowState !== "categoria" && flowState !== "emviagem" && (
          <RideCapsule text={capsuleText} pulse={pulseActive} />
        )}
        {canGoBack && flowState !== "categoria" && flowState !== "emviagem" && (
          <RoundIconButton
            label="Voltar"
            icon={ArrowLeft}
            onClick={goBack}
            className="!absolute left-4 top-14 z-40"
          />
        )}
        {showDestEditor && (
          <SolicitarPanel
            origin={origin}
            destination={destination}
            stops={stops}
            onEditOrigin={() => setPlacePicker({ target: "origin" })}
            onEditDestination={() => setPlacePicker({ target: "destination" })}
            onAddStop={handleAddStop}
            onEditStop={(id) => setPlacePicker({ target: "edit-stop", id })}
            onRemoveStop={handleRemoveStop}
            onMoveStops={handleMoveStops}
            onPickDestination={(dest) => handleChangeDestination(dest)}
            onProceed={handleProceedSolicitar}
            onClose={() => setDestEditorOpen(false)}
            companionLabel={companionLabel ?? trip?.companionLabel}
            routeMeta={routeMeta}
            routeStatus={routeStatus}
            onPickFriend={handleOpenPickFriend}
            pickFriendDisabled={!canPickFriend}
            occupancyLabel={occupancy.passengerLabel}
            vacancyLabel={occupancy.vacancyLabel}
            map={
              <RideMap
                contained
                compactPins
                origin={origin}
                destination={destination}
                stops={stops}
                destinationLabel={destination?.label ?? "Destino"}
                originLabel={origin?.label ?? CURRENT_RIDE_ORIGIN_LABEL}
                routeStatus={routeStatus}
                onRetryRoute={() => setRouteRetry((value) => value + 1)}
                onOriginClick={() => setPlacePicker({ target: "origin" })}
                onDestinationClick={() => setPlacePicker({ target: "destination" })}
                onStopClick={(id) => setPlacePicker({ target: "edit-stop", id })}
              />
            }
          />
        )}
        {!placePicker && flowState !== "solicitar" && renderPanel()}
      </div>

      {/* Overlays */}
      <RidePlacePickerOverlay
        open={placePicker != null}
        title={
          placePicker?.target === "origin"
            ? "Alterar origem"
            : placePicker?.target === "destination"
              ? "Alterar destino"
              : placePicker?.target === "edit-stop"
                ? "Editar parada"
                : "Adicionar parada"
        }
        allowCurrentLocation={placePicker?.target === "origin"}
        onClose={() => setPlacePicker(null)}
        onConfirm={handlePickedPlace}
      />
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
        onPickFriend={handleOpenPickFriend}
        pickFriendDisabled={!canPickFriend}
        pickFriendHint={occupancy.vacancyLabel}
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
      <PickFriendOverlay
        open={showPickFriend}
        onClose={() => setShowPickFriend(false)}
        occupancy={occupancy}
        candidates={friendCandidates}
        invites={friendInvites}
        stopLimitReached={stops.length >= MAX_ROUTE_STOPS}
        onInvite={handleInviteFriend}
        onCancelInvite={handleCancelFriend}
        onRespond={handleRespondFriend}
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
        originLabel={origin?.label ?? CURRENT_RIDE_ORIGIN_LABEL}
        stops={stops.map((stop, idx) => ({ label: stop.label, order: idx + 1 }))}
        destination={displayDestination}
      />
    </div>
  );
}
