import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Check, LogOut, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Gradients, Shadows } from "@/theme";
import { PresenceVisibilityMeta } from "@/lib/event-checkin/checkin-types";
import type { PresenceVisibilityValue } from "@/lib/event-checkin/checkin-types";
import type { PresenceTargetInput } from "@/lib/presence/presence-privacy";
import { usePresence } from "@/providers/presence/presence-provider";
import { currentUser } from "@/lib/mock-data";
import { CheckinModal } from "./checkin-modal";
import { CheckinSuccess } from "./checkin-success";

interface PresenceCheckinProps {
  target: PresenceTargetInput;
  label?: string;
  compact?: boolean;
}

export function PresenceCheckin({
  target,
  label = "Presença",
  compact = false,
}: PresenceCheckinProps) {
  const {
    checkins,
    visibility: savedVisibility,
    setVisibility,
    checkIn,
    leave,
    updateVisibility,
  } = usePresence();

  const myCheckin = useMemo(
    () =>
      checkins.find((r) => r.userId === currentUser.id && r.targetId === target.id && !r.leftAt),
    [checkins, target.id],
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [draftVisibility, setDraftVisibility] = useState<PresenceVisibilityValue>(savedVisibility);
  const [savePreference, setSavePreference] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editing, setEditing] = useState(false);

  function openModal() {
    setDraftVisibility(myCheckin?.visibility ?? savedVisibility);
    setSavePreference(true);
    setEditing(!!myCheckin);
    setModalOpen(true);
  }

  function handleConfirm() {
    if (myCheckin && editing) {
      updateVisibility(target.id, draftVisibility);
      if (savePreference) setVisibility(draftVisibility);
    } else {
      checkIn(target, draftVisibility);
      if (savePreference) setVisibility(draftVisibility);
    }
    setModalOpen(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2600);
  }

  function handleLeave() {
    leave(target.id);
  }

  if (myCheckin) {
    const meta = PresenceVisibilityMeta[myCheckin.visibility];
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-700">Presente Agora</p>
              <p className="text-[11px] text-emerald-600/80">
                {meta.emoji} {meta.label}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-soft transition-transform active:scale-95"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Alterar
          </button>
        </div>
        <button
          type="button"
          onClick={handleLeave}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent/50"
        >
          <LogOut className="h-4 w-4" />
          Sair do local
        </button>

        <CheckinModal
          isOpen={modalOpen}
          eventName={target.name}
          visibility={draftVisibility}
          onVisibilityChange={setDraftVisibility}
          savePreference={savePreference}
          onSavePreferenceChange={setSavePreference}
          onConfirm={handleConfirm}
          onClose={() => setModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        onClick={openModal}
        className={cn(
          "relative w-full flex items-center justify-center gap-2 rounded-2xl font-semibold text-white transition-colors",
          compact ? "px-4 py-3 text-sm" : "px-6 py-4",
        )}
        style={{ background: Gradients.primary, boxShadow: Shadows.floatingButton }}
      >
        <MapPin className="h-5 w-5" />
        <span>📍 {label}</span>
      </motion.button>

      <CheckinModal
        isOpen={modalOpen}
        eventName={target.name}
        visibility={draftVisibility}
        onVisibilityChange={setDraftVisibility}
        savePreference={savePreference}
        onSavePreferenceChange={setSavePreference}
        onConfirm={handleConfirm}
        onClose={() => setModalOpen(false)}
      />

      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6 backdrop-blur-sm">
            <CheckinSuccess eventName={target.name} onClose={() => setShowSuccess(false)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
