import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapCanvas } from "@/components/map-canvas";
import { places } from "@/lib/mock-data";
import { proximityLabel, proximityRadius } from "@/lib/proximity";
import { MapPin, X, Send, Navigation } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type MeetupPick = { placeName: string; proximity: string; cover?: string };

export function MeetupSheet({
  open,
  onClose,
  personName,
  onSuggest,
  onShareMyLocation,
}: {
  open: boolean;
  onClose: () => void;
  personName: string;
  onSuggest: (pick: MeetupPick) => void;
  onShareMyLocation: () => void;
}) {
  const sorted = [...places].sort((a, b) => a.distanceMeters - b.distanceMeters);
  const [pending, setPending] = useState<
    { kind: "place"; pick: MeetupPick } | { kind: "self" } | null
  >(null);

  const confirmMessage =
    pending?.kind === "place"
      ? `Compartilhar “${pending.pick.placeName}” com ${personName.split(" ")[0]}?`
      : `Compartilhar sua localização atual com ${personName.split(" ")[0]}?`;

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-foreground/40 z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl bg-surface border-t border-border shadow-elegant max-h-[85%] flex flex-col"
            >
              <div className="pt-2 pb-1 flex justify-center">
                <span className="h-1.5 w-10 rounded-full bg-border" />
              </div>
              <div className="px-4 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-base">
                    Encontrar-se com {personName.split(" ")[0]}
                  </h3>
                  <p className="text-xs text-muted-foreground">Escolha um local para sugerir</p>
                </div>
                <button
                  onClick={onClose}
                  className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-4">
                <MapCanvas
                  height={140}
                  pins={[
                    { x: 40, y: 70, kind: "user", label: "Você" },
                    { x: 65, y: 55, kind: "person", label: personName.split(" ")[0] },
                    { x: 32, y: 40, kind: "place" },
                    { x: 72, y: 30, kind: "place" },
                  ]}
                />
              </div>

              <div className="flex-1 overflow-y-auto px-4 mt-3 pb-4 space-y-2.5">
                {sorted.map((pl) => (
                  <div
                    key={pl.id}
                    className="rounded-2xl border border-border bg-surface p-3 flex items-center gap-3 shadow-soft"
                  >
                    <img src={pl.cover} alt="" className="h-14 w-14 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase font-semibold text-primary">
                        {pl.category}
                      </div>
                      <div className="font-semibold text-sm truncate">{pl.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        <MapPin className="inline h-3 w-3 mr-0.5" />{" "}
                        {proximityLabel(pl.distanceMeters)} · {proximityRadius(pl.distanceMeters)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() =>
                          setPending({
                            kind: "place",
                            pick: {
                              placeName: pl.name,
                              cover: pl.cover,
                              proximity: `${proximityLabel(pl.distanceMeters)} · ${proximityRadius(pl.distanceMeters)}`,
                            },
                          })
                        }
                        className="rounded-full bg-gradient-brand text-white text-[11px] font-semibold px-3 py-1.5 shadow-soft inline-flex items-center gap-1"
                      >
                        <Send className="h-3 w-3" /> Sugerir aqui
                      </button>
                      <Link
                        to="/local/$id"
                        params={{ id: pl.id }}
                        className="rounded-full bg-secondary text-foreground text-[11px] font-semibold px-3 py-1.5 text-center"
                      >
                        Ver local
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 pb-4 pt-2 border-t border-border">
                <button
                  onClick={() => setPending({ kind: "self" })}
                  className="w-full h-11 rounded-2xl bg-accent text-primary font-semibold text-sm inline-flex items-center justify-center gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  Compartilhar minha localização atual
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar compartilhamento</AlertDialogTitle>
            <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending?.kind === "place") onSuggest(pending.pick);
                else if (pending?.kind === "self") onShareMyLocation();
                setPending(null);
              }}
            >
              Compartilhar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
