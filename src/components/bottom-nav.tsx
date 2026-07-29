import {
  Home,
  Map,
  Car,
  Store,
  User,
  MessageCircle,
  Navigation,
  Calendar,
  FileText,
  MapPin,
  Film,
  Plus,
  LayoutDashboard,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AppIcon } from "@/components/ui/app-icon";
import { UserRole } from "@/lib/roles/roles-types";
import { getBottomNavConfig } from "@/lib/roles/roles-engine";
import type { RoleMode } from "@/lib/roles/roles-types";

const iconMap: Record<string, typeof Home> = {
  Home,
  Map,
  Car,
  Store,
  User,
  MessageCircle,
  Navigation,
  Calendar,
  FileText,
  MapPin,
  Film,
  Plus,
  LayoutDashboard,
};

interface BottomNavProps {
  activeRole?: RoleMode;
}

interface NavItem {
  label: string;
  icon: typeof Home;
  route: string;
}

export default function BottomNav({ activeRole = UserRole.USER }: BottomNavProps) {
  const navigate = useNavigate();
  const config = getBottomNavConfig(activeRole);

  const left: NavItem[] = config.leftItems.map((item) => ({
    label: item.label,
    icon: iconMap[item.icon] ?? Home,
    route: item.route,
  }));

  const right: NavItem[] = config.rightItems.map((item) => ({
    label: item.label,
    icon: iconMap[item.icon] ?? Home,
    route: item.route,
  }));

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-background border-t flex items-center justify-around z-50">
      {left.map((item) => (
        <button
          key={item.label}
          onClick={() => navigate({ to: item.route })}
          className="flex flex-col items-center gap-1"
        >
          <item.icon size={22} />
          <span className="text-xs">{item.label}</span>
        </button>
      ))}

      <button
        onClick={() => navigate({ to: config.centerItem.route })}
        className="relative -mt-10 h-16 w-16 rounded-full shadow-xl bg-white flex items-center justify-center"
      >
        <AppIcon size="xl" priority />
      </button>

      {right.map((item) => (
        <button
          key={item.label}
          onClick={() => navigate({ to: item.route })}
          className="flex flex-col items-center gap-1"
        >
          <item.icon size={22} />
          <span className="text-xs">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
