import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/phone-frame";
import { BottomNav } from "@/components/bottom-nav";
import { PromoPopup } from "@/components/promo-popup";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar pb-2">
          <Outlet />
        </div>
        <PromoPopup />
        <BottomNav />
      </div>
    </PhoneFrame>
  );
}
