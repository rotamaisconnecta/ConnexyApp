import { AnimatePresence, motion } from "framer-motion";
import { MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckinModalProps {
  isOpen: boolean;
  eventName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function CheckinModal({ isOpen, eventName, onConfirm, onClose }: CheckinModalProps) {
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F1FF]">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <h3 className="font-display text-lg font-bold text-foreground">
              Fazer check-in no {eventName}?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Confirme sua presença neste evento para que outros participantes possam ver.
            </p>

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
                  "bg-gradient-to-r from-[#6C3BFF] to-[#8B5CFF] shadow-[0_4px_16px_rgba(108,59,255,0.35)]",
                  "hover:shadow-[0_6px_20px_rgba(108,59,255,0.45)]",
                )}
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
