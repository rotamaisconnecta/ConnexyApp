import { useState, useEffect } from "react";
import { createFileRoute, Outlet, useMatch, useNavigate, redirect } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/phone-frame";
import BottomNav from "@/components/bottom-nav";
import { useAuth } from "@/hooks/use-auth";
import { ContextEngineProvider } from "@/lib/context/context-provider";
import { PresenceProvider } from "@/providers/presence/presence-context";
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

  const conversationOpen = Boolean(
    useMatch({
      from: "/_app/chat/$conversationId",
      shouldThrow: false,
    }),
  );

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
        <PresenceProvider userId={user.id}>
          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="flex-1 overflow-y-auto no-scrollbar pb-[calc(env(safe-area-inset-bottom,0px)+5rem)] relative">
              <Outlet />
            </div>
            {!conversationOpen && <BottomNav />}
          </div>
        </PresenceProvider>
      </ContextEngineProvider>
    </PhoneFrame>
  );
}
