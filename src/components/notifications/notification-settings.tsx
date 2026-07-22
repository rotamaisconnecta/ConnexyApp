import { useState } from "react";
import { motion } from "framer-motion";
import type { NotificationSettingsState } from "@/lib/notifications/notification-types";
import { toggleSetting } from "@/lib/notifications/notification-settings";
import { ArrowLeft } from "lucide-react";

const SETTINGS_LABELS: { key: keyof NotificationSettingsState; label: string }[] = [
  { key: "message", label: "Mensagens" },
  { key: "connectionRequest", label: "Pedidos de conexão" },
  { key: "connectionAccepted", label: "Conexões aceitas" },
  { key: "nearbyPerson", label: "Pessoas próximas" },
  { key: "nearbyMoment", label: "Momentos próximos" },
  { key: "nearbyOffer", label: "Ofertas próximas" },
  { key: "nearbyEvent", label: "Eventos próximos" },
  { key: "driverFound", label: "Motorista encontrado" },
  { key: "rideStarted", label: "Corrida iniciada" },
  { key: "rideFinished", label: "Corrida finalizada" },
  { key: "businessFollow", label: "Empresas seguindo" },
  { key: "couponAvailable", label: "Cupons disponíveis" },
  { key: "like", label: "Curtidas" },
  { key: "comment", label: "Comentários" },
  { key: "mention", label: "Menções" },
  { key: "share", label: "Compartilhamentos" },
];

interface NotificationSettingsProps {
  settings: NotificationSettingsState;
  onChange: (settings: NotificationSettingsState) => void;
  onBack?: () => void;
}

export function NotificationSettings({ settings, onChange, onBack }: NotificationSettingsProps) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex h-14 items-center gap-3 px-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#18181B]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-bold text-[#18181B]">Configurações</h1>
      </header>

      <div className="flex flex-col gap-1 px-4">
        {SETTINGS_LABELS.map(({ key, label }) => (
          <motion.div
            key={key}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(toggleSetting(settings, key))}
            className="flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-[#F8F8FC]"
          >
            <span className="text-sm text-[#18181B]">{label}</span>
            <div
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings[key] ? "bg-[#6C3BFF]" : "bg-[#E7E7F2]"
              }`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  settings[key] ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
