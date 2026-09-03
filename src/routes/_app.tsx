import { useEffect, useRef } from "react";
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
import { PresenceProvider as CheckInPresenceProvider } from "@/providers/presence/presence-provider";
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const conversationOpen = Boolean(
    useMatch({
      from: "/_app/chat/$conversationId",
      shouldThrow: false,
    }),
  );
  const requestOpen = Boolean(
    useMatch({
      from: "/_app/solicitacao/$id",
      shouldThrow: false,
    }),
  );
  const profileEditorOpen = useRouterState({
    select: (state) => {
      if (state.location.pathname !== "/perfil") return false;
      const search = state.location.search as { edit?: unknown };
      return search.edit === true || search.edit === "true";
    },
  });
  const immersiveRouteOpen = conversationOpen || requestOpen || profileEditorOpen;

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    scrollAreaRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

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
    <PhoneFrame>
      <CheckInPresenceProvider>
        <ContextEngineProvider>
          <PresenceProvider userId={user.id}>
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                ref={scrollAreaRef}
                className={`relative min-h-0 flex-1 overflow-y-auto no-scrollbar ${
                  immersiveRouteOpen ? "pb-0" : "pb-[calc(env(safe-area-inset-bottom,0px)+5rem)]"
                }`}
              >
                <Outlet />
              </div>
              {!immersiveRouteOpen && <BottomNav />}
            </div>
          </PresenceProvider>
        </ContextEngineProvider>
      </CheckInPresenceProvider>
    </PhoneFrame>
  );
}
