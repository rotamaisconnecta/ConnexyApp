import { useEffect, useLayoutEffect, useRef } from "react";
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
  redirect,
} from "@tanstack/react-router";
import { PhoneFrame } from "@/components/phone-frame";
import BottomNav from "@/components/bottom-nav";
import { useAuth } from "@/hooks/use-auth";
import { useDriverMode, restoreModeOnBoot } from "@/hooks/use-driver-mode";
import { DriverModeSocialBlock } from "@/components/driver/driver-mode-social-block";
import { ContextEngineProvider } from "@/lib/context/context-provider";
import { PresenceProvider as CheckInPresenceProvider } from "@/providers/presence/presence-provider";
import { PresenceProvider } from "@/providers/presence/presence-context";
import { requireAuth } from "@/lib/auth/route-guard";
import { profileCompletionForGuard } from "@/lib/profile/profile-status";
import { Loader2 } from "lucide-react";
import {
  APP_SCROLL_PADDING_BOTTOM,
  BOTTOM_NAV_HEIGHT,
  isAppBottomNavVisible,
  resetAppRouteScroll,
  routeOwnsScroll as routeOwnsInternalScroll,
} from "@/lib/shell/app-shell";

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const locationHref = useRouterState({ select: (state) => state.location.href });

  const profileEditorOpen = useRouterState({
    select: (state) => {
      if (state.location.pathname !== "/perfil") return false;
      const search = state.location.search as { edit?: unknown };
      return search.edit === true || search.edit === "true";
    },
  });
  const routeOwnsScroll = routeOwnsInternalScroll(pathname);

  const { isDriverMode } = useDriverMode();
  const socialRouteOpen =
    pathname === "/pessoas" ||
    pathname === "/matching" ||
    pathname === "/connecta" ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/solicitacao");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    restoreModeOnBoot();
  }, []);

  useLayoutEffect(() => {
    const reset = () => resetAppRouteScroll(scrollAreaRef.current);
    reset();
    const frame = window.requestAnimationFrame(() => {
      reset();
      window.requestAnimationFrame(reset);
    });
    const timeout = window.setTimeout(reset, 50);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [locationHref, profileEditorOpen, routeOwnsScroll]);

  if (loading || !user) {
    return (
      <PhoneFrame>
        <div className="grid flex-1 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame contentScrollable={false}>
      <CheckInPresenceProvider>
        <ContextEngineProvider>
          <PresenceProvider userId={user.id}>
            <div
              className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
              style={{ ["--bottom-nav-height" as string]: BOTTOM_NAV_HEIGHT }}
            >
              <div
                ref={scrollAreaRef}
                data-app-scroll="global"
                style={{ paddingBottom: APP_SCROLL_PADDING_BOTTOM }}
                className={`relative min-h-0 flex-1 no-scrollbar ${
                  routeOwnsScroll ? "flex flex-col overflow-hidden" : "overflow-y-auto"
                }`}
              >
                {isDriverMode && socialRouteOpen ? <DriverModeSocialBlock /> : <Outlet />}
              </div>
              {isAppBottomNavVisible(pathname) && <BottomNav />}
            </div>
          </PresenceProvider>
        </ContextEngineProvider>
      </CheckInPresenceProvider>
    </PhoneFrame>
  );
}
