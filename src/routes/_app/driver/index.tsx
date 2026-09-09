import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Car, ShieldCheck } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { DriverOperationsDashboard } from "@/components/driver/driver-operations-dashboard";
import { DriverRideBottomSheet } from "@/components/driver/driver-ride-bottom-sheet";
import { CancelConfirmModal } from "@/components/mobility/ride/ride-overlays";
import { currentUser } from "@/lib/mock-data";
import type { RideRequest } from "@/lib/driver/driver-types";
import { DEMO_DRIVER_ID } from "@/lib/mobility/dispatch/demo-fleet";
import { tripStatusLabel } from "@/lib/mobility/trip/trip-machine";
import {
  acceptDemoDriverOffer,
  cancelDemoDriverAssignment,
  declineDemoDriverOffer,
  toggleDemoDriverOnline,
  useDemoDriver,
  useDemoDriverOnline,
  useDriverActiveAssignment,
  useOfferForDriver,
} from "@/hooks/use-dispatch";
import type { RideOffer } from "@/lib/mobility/dispatch/dispatch-types";

export const Route = createFileRoute("/_app/driver/")({
  head: () => ({ meta: [{ title: "Motorista — Connexy" }] }),
  component: DriverPage,
});

/* ─── Mapeia a oferta do dispatcher para o RideRequest do driver ── */

function offerToDriverRequest(offer: RideOffer): RideRequest {
  return {
    id: offer.id,
    passengerId: "passenger-demo",
    passengerName: offer.passengerName,
    passengerPhoto: offer.passengerPhoto,
    passengerRating: offer.passengerRating,
    origin: offer.origin,
    originLat: offer.originLat,
    originLng: offer.originLng,
    destination: offer.destination,
    destinationLat: offer.destinationLat,
    destinationLng: offer.destinationLng,
    distance: offer.distanceMeters,
    duration: offer.durationMinutes,
    price: offer.price,
    paymentMethod: offer.paymentMethod === "pix" ? ("PIX" as const) : ("CASH" as const),
    status: "PENDING" as const,
    createdAt: new Date(offer.offeredAt),
  };
}

function DriverPage() {
  const navigate = useNavigate();
  const driver = useDemoDriver(DEMO_DRIVER_ID);
  const isOnline = useDemoDriverOnline(DEMO_DRIVER_ID);
  const offer = useOfferForDriver(DEMO_DRIVER_ID);
  const active = useDriverActiveAssignment(DEMO_DRIVER_ID);
  const [showCancel, setShowCancel] = useState(false);

  const midTrip = active?.tripStatus === "emviagem" || active?.tripStatus === "parada";

  return (
    <div className="flex-1">
      <StatusBar />
      <div className="px-4 pt-1">
        <DriverOperationsDashboard
          driverName={driver.name}
          driverPhoto={driver.photo}
          isOnline={isOnline}
          onToggleOnline={() => toggleDemoDriverOnline(DEMO_DRIVER_ID)}
          onOpenMap={() => navigate({ to: "/discover" })}
          onOpenDocuments={() => navigate({ to: "/driver/profile" })}
        />
      </div>

      {active && (
        <div className="px-4 pt-2">
          <section className="overflow-hidden rounded-3xl border border-border bg-surface p-4 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-600/10 text-violet-600">
                  <Car className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Corrida ativa
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {tripStatusLabel(active.tripStatus)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCancel(true)}
                className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600"
              >
                <ShieldCheck className="h-3.5 w-3.5 rotate-45" />
                Cancelar corrida
              </button>
            </div>
          </section>
        </div>
      )}

      <DriverRideBottomSheet
        isOpen={offer !== null}
        onClose={() => {
          if (offer) declineDemoDriverOffer(DEMO_DRIVER_ID);
        }}
        request={offer ? offerToDriverRequest(offer) : null}
        onAccept={() => acceptDemoDriverOffer(DEMO_DRIVER_ID)}
        onDecline={() => declineDemoDriverOffer(DEMO_DRIVER_ID)}
      />

      <CancelConfirmModal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancelar corrida?"
        dismissLabel="Continuar"
        confirmLabel="Cancelar corrida"
        reason={
          midTrip
            ? "Você já está em viagem. Desistir encerra a corrida do passageiro e você fica disponível novamente."
            : "Você já aceitou esta corrida. Desistir antes do embarque a re-oferecerá a outro motorista."
        }
        onConfirm={() => {
          setShowCancel(false);
          if (active) cancelDemoDriverAssignment(active.tripId, DEMO_DRIVER_ID);
        }}
      />
    </div>
  );
}
