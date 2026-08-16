import { useState, useEffect } from "react";
import { createFileRoute, Outlet, useNavigate, useMatch, redirect } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/phone-frame";
import BottomNav from "@/components/bottom-nav";
import { PromoPopup } from "@/components/promo-popup";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/hooks/use-auth";
import { ContextEngineProvider } from "@/lib/context/context-provider";
import { PresenceProvider } from "@/providers/presence/presence-provider";
import { requireAuth } from "@/lib/auth/route-guard";
import { profileCompletionForGuard } from "@/lib/profile/profile-status";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    await requireAuth({ location });
    const status = await profileCompletionForGuard();
    if (status.authenticated && !status.complete) {
      const to =
        status.step === "interesses" ? ("/interesses" as const) : ("/completar-perfil" as const);
      throw redirect({ to, replace: true });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const onNotificacoes = useMatch({ from: "/_app/notificacoes", shouldThrow: false });
  const onNotifications = useMatch({ from: "/_app/notifications", shouldThrow: false });
  const onChat = useMatch({ from: "/_app/chat", shouldThrow: false });
  const hideBell = Boolean(onNotificacoes || onNotifications || onChat);

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
              {!hideBell && (
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-end px-4"
                  style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 2.5rem)" }}
                >
                  <div className="pointer-events-auto">
                    <NotificationBell />
                  </div>
                </div>
              )}
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
