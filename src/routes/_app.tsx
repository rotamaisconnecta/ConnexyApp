import { useState, useEffect } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/phone-frame";
import BottomNav from "@/components/bottom-nav";
import { PromoPopup } from "@/components/promo-popup";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/hooks/use-auth";
import { ContextEngineProvider } from "@/lib/context/context-provider";
import { PresenceProvider } from "@/providers/presence/presence-provider";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  if (loading || !user) {
    return (
      <PhoneFrame>
        <div className="flex-1 grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <ContextEngineProvider>
        <PresenceProvider>
          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="flex-1 overflow-y-auto no-scrollbar pb-2 relative">
              <div className="absolute top-2 right-4 z-50">
                <NotificationBell />
              </div>
              <Outlet />
            </div>
            <PromoPopup />
            <BottomNav />
          </div>
        </PresenceProvider>
      </ContextEngineProvider>
    </PhoneFrame>
  );
}
