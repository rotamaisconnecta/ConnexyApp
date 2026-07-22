import { motion } from "framer-motion";

interface DriverPreferencesProps {
  acceptsPet: boolean;
  acceptsBaggage: boolean;
  hasAirConditioning: boolean;
  acceptsShared: boolean;
  onToggle: (key: string, value: boolean) => void;
}

export function DriverPreferences({
  acceptsPet,
  acceptsBaggage,
  hasAirConditioning,
  acceptsShared,
  onToggle,
}: DriverPreferencesProps) {
  const prefs = [
    { key: "acceptsPet", label: "Aceita Pet", value: acceptsPet },
    { key: "acceptsBaggage", label: "Aceita Bagagem", value: acceptsBaggage },
    { key: "hasAirConditioning", label: "Ar-condicionado", value: hasAirConditioning },
    { key: "acceptsShared", label: "Corrida Compartilhada", value: acceptsShared },
  ];

  return (
    <div className="space-y-2">
      {prefs.map((pref, i) => (
        <motion.div
          key={pref.key}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3"
        >
          <span className="text-sm font-semibold">{pref.label}</span>
          <button
            type="button"
            onClick={() => onToggle(pref.key, !pref.value)}
            className={`relative h-6 w-11 rounded-full transition-colors ${pref.value ? "bg-primary" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${pref.value ? "left-[22px]" : "left-0.5"}`}
            />
          </button>
        </motion.div>
      ))}
    </div>
  );
}
