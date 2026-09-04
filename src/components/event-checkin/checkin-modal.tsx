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
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 px-3 pt-3 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkin-modal-title"
            initial={{ opacity: 0, scale: 0.97, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 32 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[calc(100dvh-0.75rem)] w-full max-w-sm flex-col overflow-hidden rounded-t-[30px] bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-[30px]"
          >
            <div className="shrink-0 px-5 pb-3 pt-3 sm:px-6 sm:pt-5">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />

              <div className="flex items-center justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: Colors.surface }}
                >
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar confirmação de presença"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
                  style={{ borderRadius: Radius.floating }}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <h3
                id="checkin-modal-title"
                className="mt-3 font-display text-lg font-bold text-foreground"
              >
                Fazer check-in no {eventName}?
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Confirme sua presença e escolha quem poderá visualizar.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 sm:px-6">
              <PresencePrivacyPicker
                value={visibility}
                onChange={onVisibilityChange}
                savePreference={savePreference}
                onSavePreferenceChange={onSavePreferenceChange}
              />

              <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs text-muted-foreground">
                <span aria-hidden>{PresenceVisibilityMeta[visibility].emoji}</span>
                <span>
                  Sua presença será{" "}
                  <b className="font-semibold text-foreground">
                    {PresenceVisibilityMeta[visibility].label}
                  </b>
                  . Você poderá alterar depois.
                </span>
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-white/95 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-4 backdrop-blur-xl sm:px-6 sm:pb-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    "min-h-12 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors",
                    "bg-gray-100 text-foreground hover:bg-gray-200",
                  )}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={cn(
                    "min-h-12 rounded-2xl px-3 py-3 text-sm font-semibold leading-tight text-white transition-colors",
                    "hover:opacity-90",
                  )}
                  style={{ background: Gradients.primary, boxShadow: Shadows.floatingButton }}
                >
                  Confirmar presença
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
