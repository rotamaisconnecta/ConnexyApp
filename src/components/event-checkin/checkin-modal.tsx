import { AnimatePresence, motion } from "framer-motion";
import { MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Colors, Gradients, Radius, Shadows } from "@/theme";
import type { PresenceVisibilityValue } from "@/lib/event-checkin/checkin-types";
import { PresenceVisibilityMeta } from "@/lib/event-checkin/checkin-types";
import { PresencePrivacyPicker } from "./presence-privacy-picker";

interface CheckinModalProps {
  isOpen: boolean;
  eventName: string;
  visibility: PresenceVisibilityValue;
  onVisibilityChange: (visibility: PresenceVisibilityValue) => void;
  savePreference: boolean;
  onSavePreferenceChange: (save: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function CheckinModal({
  isOpen,
  eventName,
  visibility,
  onVisibilityChange,
  savePreference,
  onSavePreferenceChange,
  onConfirm,
  onClose,
}: CheckinModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft"
          >
            <div className="mb-4 flex items-center justify-between">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: Colors.surface }}
              >
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
                style={{ borderRadius: Radius.floating }}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <h3 className="font-display text-lg font-bold text-foreground">
              Fazer check-in no {eventName}?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Confirme sua presença para que outros participantes possam ver.
            </p>

            <div className="mt-4">
              <PresencePrivacyPicker
                value={visibility}
                onChange={onVisibilityChange}
                savePreference={savePreference}
                onSavePreferenceChange={onSavePreferenceChange}
              />
            </div>

            <div className="mt-2 flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs text-muted-foreground">
              <span aria-hidden>{PresenceVisibilityMeta[visibility].emoji}</span>
              <span>
                Sua presença será{" "}
                <b className="font-semibold text-foreground">
                  {PresenceVisibilityMeta[visibility].label}
                </b>
                . Você poderá alterar depois.
              </span>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className={cn(
                  "flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                  "bg-gray-100 text-foreground hover:bg-gray-200",
                )}
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className={cn(
                  "flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-colors",
                  "hover:opacity-90",
                )}
                style={{ background: Gradients.primary, boxShadow: Shadows.floatingButton }}
              >
                Confirmar presença
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
