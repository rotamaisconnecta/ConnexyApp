import { useState, useEffect } from "react";
import {
  createFileRoute,
  Outlet,
  useMatch,
  useNavigate,
  useRouterState,
  redirect,
} from "@tanstack/react-router";
import { PhoneFrame } from "@/components/phone-frame";
import BottomNav from "@/components/bottom-nav";
import { useAuth } from "@/hooks/use-auth";
import { ContextEngineProvider } from "@/lib/context/context-provider";
import { PresenceProvider } from "@/providers/presence/presence-provider";
import { requireAuth } from "@/lib/auth/route-guard";
import { profileCompletionForGuard } from "@/lib/profile/profile-status";
import { Loader2 } from "lucide-react";
import { getActiveMode, setActiveMode } from "@/lib/roles/roles-storage";
import { UserRole } from "@/lib/roles/roles-types";
import { isDriverApproved } from "@/lib/driver/driver-application-storage";

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
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [activeMode, setActiveModeState] = useState(getActiveMode);

  const conversationOpen = Boolean(
    useMatch({
      from: "/_app/chat/$conversationId",
      shouldThrow: false,
    }),
  );

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    const syncMode = () => setActiveModeState(getActiveMode());
    window.addEventListener("roleChanged", syncMode);
    window.addEventListener("driverApplicationChanged", syncMode);
    return () => {
      window.removeEventListener("roleChanged", syncMode);
      window.removeEventListener("driverApplicationChanged", syncMode);
    };
  }, []);

  useEffect(() => {
    const enteringDriverArea =
      (pathname === "/driver" || pathname.startsWith("/driver/")) &&
      pathname !== "/driver/cadastro";

    if (enteringDriverArea && !isDriverApproved()) {
      nav({ to: "/driver/cadastro", replace: true });
      return;
    }

    if (enteringDriverArea && activeMode !== UserRole.DRIVER) {
      setActiveMode(UserRole.DRIVER);
      setActiveModeState(UserRole.DRIVER);
      window.dispatchEvent(new Event("roleChanged"));
      return;
    }

    if (activeMode !== UserRole.DRIVER) return;

    if (!isDriverApproved()) {
      setActiveMode(UserRole.USER);
      setActiveModeState(UserRole.USER);
      window.dispatchEvent(new Event("roleChanged"));
      nav({ to: "/driver/cadastro", replace: true });
      return;
    }

    const socialRoute = [
      "/pessoas",
      "/people",
      "/connecta",
      "/chat",
      "/solicitacao",
      "/perfil/",
      "/create",
      "/feed",
      "/reels",
    ].some(
      (route) =>
        pathname === route || pathname.startsWith(route.endsWith("/") ? route : `${route}/`),
    );

    if (pathname === "/home" || socialRoute) {
      nav({ to: "/driver", replace: true });
    }
  }, [activeMode, nav, pathname]);

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
