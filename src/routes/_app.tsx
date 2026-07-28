import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/phone-frame";
import BottomNav from "@/components/bottom-nav";
import { PromoPopup } from "@/components/promo-popup";
import { useAuth } from "@/hooks/use-auth";
import { ContextEngineProvider } from "@/lib/context/context-provider";
import { Loader2 } from "lucide-react";
import { getActiveMode } from "@/lib/roles/roles-storage";
import type { RoleMode } from "@/lib/roles/roles-types";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [activeMode, setActiveMode] = useState<RoleMode>(getActiveMode);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  const handleRoleChanged = useCallback(() => {
    setActiveMode(getActiveMode());
  }, []);

  useEffect(() => {
    window.addEventListener("roleChanged", handleRoleChanged);
    return () => window.removeEventListener("roleChanged", handleRoleChanged);
  }, [handleRoleChanged]);

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
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar pb-2">
            <Outlet />
          </div>
          <PromoPopup />
          <BottomNav activeRole={activeMode} />
        </div>
      </ContextEngineProvider>
    </PhoneFrame>
  );
}
