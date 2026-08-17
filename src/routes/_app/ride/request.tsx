import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { RideSummary } from "@/components/mobility/ride-summary";
import { PriceEstimateDisplay } from "@/components/mobility/price-estimate";
import { RoutePreview } from "@/components/mobility/route-preview";
import { PaymentSelector } from "@/components/mobility/payment-selector";
import { CouponSelector } from "@/components/mobility/coupon-selector";
import { RideTypeSelector } from "@/components/mobility/ride-type-selector";
import { estimateAllCategories } from "@/lib/mobility/ride-pricing";
import { BackButton } from "@/components/navigation/back-button";
import { useState } from "react";
import type {
  VehicleCategoryValue,
  PaymentMethodValue,
  PriceEstimate,
} from "@/lib/mobility/ride-types";
import { VehicleCategory, PaymentMethod } from "@/lib/mobility/ride-types";
import { applyCoupon } from "@/lib/mobility/ride-pricing";
import { z } from "zod";

const rideSearchSchema = z.object({
  destinationId: z.string().optional().nullable(),
  destinationName: z.string().optional().nullable(),
  destinationAddress: z.string().optional().nullable(),
  destinationLat: z.number().optional().nullable(),
  destinationLng: z.number().optional().nullable(),
  source: z.string().optional().nullable(),
});

export const Route = createFileRoute("/_app/ride/request")({
  head: () => ({ meta: [{ title: "Confirmar viagem — RotaMais" }] }),
  validateSearch: rideSearchSchema,
  component: RideRequestConfirmPage,
});

const MOCK_COUPONS = [
  {
    id: "1",
    code: "ROTA20",
    label: "ROTA20",
    description: "20% OFF na primeira viagem",
    discountPercent: 20,
    maxDiscount: 30,
    validUntil: new Date("2026-12-31"),
    active: true,
  },
  {
    id: "2",
    code: "AMIZADE10",
    label: "AMIZADE10",
    description: "10% OFF para amigos",
    discountPercent: 10,
    maxDiscount: 15,
    validUntil: new Date("2026-12-31"),
    active: true,
  },
];

function RideRequestConfirmPage() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const [category, setCategory] = useState<VehicleCategoryValue>(VehicleCategory.ECONOMICO);
  const [payment, setPayment] = useState<PaymentMethodValue>(PaymentMethod.CREDIT);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  const destName = search.destinationName ?? "Shopping Ibirapuera";
  const destLat = search.destinationLat ?? -23.58;
  const destLng = search.destinationLng ?? -46.65;
  const destAddress = search.destinationAddress ?? "";

  const distanceMeters = 3500;
  const durationMinutes = 12;
  const allEstimates = estimateAllCategories(distanceMeters, durationMinutes);
  const currentEstimate = allEstimates.find((e) => e.category === category) ?? allEstimates[0];

  const discountPercent = couponCode
    ? (MOCK_COUPONS.find((c) => c.code === couponCode)?.discountPercent ?? 0)
    : 0;
  const maxDiscount = couponCode
    ? (MOCK_COUPONS.find((c) => c.code === couponCode)?.maxDiscount ?? 0)
    : 0;
  const adjustedEstimate: PriceEstimate = {
    ...currentEstimate,
    finalPrice: applyCoupon(currentEstimate.finalPrice, discountPercent, maxDiscount),
    discount:
      currentEstimate.finalPrice -
      applyCoupon(currentEstimate.finalPrice, discountPercent, maxDiscount),
  };

  return (
    <div className="flex-1 flex flex-col">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 pt-1 pb-3">
        <BackButton
          fallbackTo="/ride"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <div>
          <h1 className="font-display font-bold text-base">Confirmar viagem</h1>
          <p className="text-[11px] text-muted-foreground">Revise os detalhes</p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-4 space-y-4 overflow-y-auto no-scrollbar">
        {search.destinationName && (
          <div className="rounded-2xl border border-border bg-surface p-3">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Destino</p>
            <p className="text-sm font-bold mt-0.5">{destName}</p>
            {destAddress && <p className="text-xs text-muted-foreground mt-0.5">{destAddress}</p>}
          </div>
        )}

        <RoutePreview
          origin={{ lat: -23.55, lng: -46.64, label: "Minha localização" }}
          destination={{ lat: destLat, lng: destLng, label: destName }}
          distanceMeters={distanceMeters}
          durationMinutes={durationMinutes}
        />

        <RideTypeSelector selected={category} onSelect={setCategory} estimates={allEstimates} />

        <RideSummary
          request={{
            id: "temp",
            origin: { lat: -23.55, lng: -46.64, label: "Minha localização" },
            destination: { lat: destLat, lng: destLng, label: destName },
            stops: [],
            category,
            distanceMeters,
            durationMinutes,
            scheduledAt: null,
            couponCode,
            paymentMethod: payment,
            createdAt: new Date(),
          }}
          estimate={adjustedEstimate}
        />

        <CouponSelector coupons={MOCK_COUPONS} selectedCode={couponCode} onSelect={setCouponCode} />

        <PaymentSelector selected={payment} onSelect={setPayment} />
      </div>

      <div className="px-5 pb-4">
        <button
          onClick={() => nav({ to: "/ride/matching" })}
          className="w-full rounded-full bg-gradient-brand py-4 text-white font-semibold shadow-elegant"
        >
          Solicitar viagem
        </button>
      </div>
    </div>
  );
}
