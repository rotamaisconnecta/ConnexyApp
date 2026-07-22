import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { RideSummary } from "@/components/mobility/ride-summary";
import { PriceEstimateDisplay } from "@/components/mobility/price-estimate";
import { RoutePreview } from "@/components/mobility/route-preview";
import { PaymentSelector } from "@/components/mobility/payment-selector";
import { CouponSelector } from "@/components/mobility/coupon-selector";
import { RideTypeSelector } from "@/components/mobility/ride-type-selector";
import { estimateAllCategories } from "@/lib/mobility/ride-pricing";
import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type {
  VehicleCategoryValue,
  PaymentMethodValue,
  PriceEstimate,
} from "@/lib/mobility/ride-types";
import { VehicleCategory, PaymentMethod } from "@/lib/mobility/ride-types";
import { applyCoupon } from "@/lib/mobility/ride-pricing";

export const Route = createFileRoute("/_app/ride/request")({
  head: () => ({ meta: [{ title: "Confirmar viagem — RotaMais" }] }),
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
  const [category, setCategory] = useState<VehicleCategoryValue>(VehicleCategory.ECONOMICO);
  const [payment, setPayment] = useState<PaymentMethodValue>(PaymentMethod.CREDIT);
  const [couponCode, setCouponCode] = useState<string | null>(null);

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
        <Link to="/ride" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-base">Confirmar viagem</h1>
          <p className="text-[11px] text-muted-foreground">Revise os detalhes</p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-4 space-y-4 overflow-y-auto no-scrollbar">
        <RoutePreview
          origin={{ lat: -23.55, lng: -46.64, label: "Minha localização" }}
          destination={{ lat: -23.58, lng: -46.65, label: "Shopping Ibirapuera" }}
          distanceMeters={distanceMeters}
          durationMinutes={durationMinutes}
        />

        <RideTypeSelector selected={category} onSelect={setCategory} estimates={allEstimates} />

        <RideSummary
          request={{
            id: "temp",
            origin: { lat: -23.55, lng: -46.64, label: "Minha localização" },
            destination: { lat: -23.58, lng: -46.65, label: "Shopping Ibirapuera" },
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
