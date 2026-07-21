import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { X, Heart, MessageCircle, Check, MapPin } from "lucide-react";
import { PresenceDot } from "@/components/presence-dot";
import { type Person, compatibilityScore, compatibilityInfo, interestEmoji } from "@/lib/mock-data";
import { homeProximityLabel } from "@/lib/proximity";

export function PersonDetailSheet({
  person,
  open,
  onClose,
}: {
  person: Person | null;
  open: boolean;
  onClose: () => void;
}) {
  const [requested, setRequested] = useState(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (open) {
      setRequested(false);
      setFavorited(false);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  const score = person ? compatibilityScore(person) : 0;
  const info = person ? compatibilityInfo(score) : null;

  return (
    <AnimatePresence>
      {open && person && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/40 z-40"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="sheet"
              role="dialog"
              aria-label={`Perfil de ${person.name}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="w-full max-w-md max-h-[85vh] rounded-3xl bg-surface border border-border shadow-elegant flex flex-col pointer-events-auto"
            >
            <div className="pt-2 pb-1 flex justify-center shrink-0">
              <span className="h-1.5 w-10 rounded-full bg-border" />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-4 h-9 w-9 grid place-items-center rounded-full bg-secondary z-10"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
              <div className="relative">
                <img
                  src={person.photo}
                  alt={`Foto de ${person.name}`}
                  className="h-48 w-full rounded-2xl object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface/80 to-transparent rounded-b-2xl" />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <h2 className="font-display text-xl font-bold">
                  {person.name}, {person.age}
                </h2>
                <PresenceDot online={person.online} size={10} />
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {info && (
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${info.className}`}
                  >
                    {score}% · {info.text}
                  </span>
                )}
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {homeProximityLabel(person.distanceMeters)}
                </span>
              </div>

              {person.bio && (
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  {person.bio}
                </p>
              )}

              {person.headline && (
                <p className="mt-1.5 text-xs text-primary font-medium">
                  {person.headline}
                </p>
              )}

              <div className="mt-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Interesses
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {person.interests.map((interest) => (
                    <span
                      key={interest}
                      className="text-[11px] bg-secondary rounded-full px-2.5 py-1 font-medium"
                    >
                      {interestEmoji[interest] ?? "•"} {interest}
                    </span>
                  ))}
                </div>
              </div>

              {person.moments && person.moments.some((m) => m.photo) && (
                <div className="mt-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Galeria
                  </h3>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {person.moments
                      .filter((m) => m.photo)
                      .map((m) => (
                        <img
                          key={m.id}
                          src={m.photo}
                          alt={m.text}
                          className="h-24 w-24 rounded-xl object-cover shrink-0"
                        />
                      ))}
                  </div>
                </div>
              )}

              {person.stats && (
                <div className="mt-5 flex gap-6">
                  <div className="text-center">
                    <div className="font-display font-bold text-sm">
                      {person.stats.connections}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Conexões
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-display font-bold text-sm">
                      {person.stats.meetups}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Encontros
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-border flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setRequested(true)}
                disabled={requested}
                className="flex-1 h-12 rounded-2xl bg-gradient-brand text-white font-semibold text-sm shadow-elegant flex items-center justify-center gap-2 disabled:opacity-70 transition-all duration-200 active:scale-[0.98]"
              >
                {requested ? (
                  <>
                    <Check className="h-4 w-4" /> Solicitado
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" /> Solicitar conversa
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFavorited(!favorited)}
                className="h-12 w-12 rounded-2xl bg-secondary grid place-items-center shrink-0 transition-all duration-200 active:scale-[0.95]"
                aria-label={favorited ? "Remover dos favoritos" : "Favoritar"}
              >
                <Heart
                  className={`h-5 w-5 transition-colors duration-200 ${favorited ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
