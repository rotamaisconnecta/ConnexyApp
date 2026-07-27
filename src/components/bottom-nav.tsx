import { Home, Map, Car, Store, User, MessageCircle, Navigation } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AppIcon } from "@/components/ui/app-icon";
import { UserRole } from "@/lib/roles/roles-types";
import { getActiveMode } from "@/lib/roles/roles-storage";

interface BottomItem {
  label: string;
  icon: any;
  route: string;
}

export default function BottomNav() {
  const navigate = useNavigate();
  const mode = getActiveMode();

  let left: BottomItem[] = [];
  let right: BottomItem[] = [];

  switch (mode) {
    case UserRole.DRIVER:
      left = [
        { label: "Painel", icon: Car, route: "/driver" },
        { label: "Mapa", icon: Map, route: "/discover" },
      ];
      right = [
        { label: "Corridas", icon: Navigation, route: "/driver" },
        { label: "Perfil", icon: User, route: "/profile" },
      ];
      break;
    case UserRole.BUSINESS:
      left = [
        { label: "Home", icon: Home, route: "/feed" },
        { label: "Marketplace", icon: Store, route: "/marketplace" },
      ];
      right = [
        { label: "Chat", icon: MessageCircle, route: "/chat" },
        { label: "Perfil", icon: User, route: "/profile" },
      ];
      break;
    default:
      left = [
        { label: "Home", icon: Home, route: "/feed" },
        { label: "Mapa", icon: Map, route: "/discover" },
      ];
      right = [
        { label: "Chat", icon: MessageCircle, route: "/chat" },
        { label: "Perfil", icon: User, route: "/profile" },
      ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-background border-t flex items-center justify-around z-50">
      {left.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => navigate({ to: item.route })}
            className="flex flex-col items-center gap-1"
          >
            <Icon size={22} />
            <span className="text-xs">{item.label}</span>
          </button>
        );
      })}

      <button
        onClick={() => navigate({ to: "/create" })}
        className="relative -mt-10 h-16 w-16 rounded-full shadow-xl bg-white flex items-center justify-center"
      >
        <AppIcon size="xl" priority />
      </button>

      {right.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => navigate({ to: item.route })}
            className="flex flex-col items-center gap-1"
          >
            <Icon size={22} />
            <span className="text-xs">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
