import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneFrame } from "@/components/phone-frame";
import { BottomNav } from "@/components/bottom-nav";
import { PromoPopup } from "@/components/promo-popup";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { getStoredRoles } from "@/lib/roles/roles-storage";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [activeMode, setActiveMode] = useState(() => getStoredRoles().activeMode);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    function handleRoleChanged() {
      setActiveMode(getStoredRoles().activeMode);
    }
    window.addEventListener("roleChanged", handleRoleChanged);
    return () => window.removeEventListener("roleChanged", handleRoleChanged);
  }, []);

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
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar pb-2">
          <Outlet />
        </div>
        <PromoPopup />
        <BottomNav mode={activeMode} />
      </div>
    </PhoneFrame>
  );
}
