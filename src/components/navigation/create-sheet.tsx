import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { sheetOverlay, sheetContainer } from "./navigation-animations";
import { CreateSheetItem } from "./create-sheet-item";
import { CREATE_ACTIONS } from "@/lib/navigation/navigation-items";

interface CreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (category: string) => void;
}

export function CreateSheet({ isOpen, onClose, onSelect }: CreateSheetProps) {
  function handleSelect(label: string) {
    onSelect?.(label);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={sheetOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            variants={sheetContainer}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl max-h-[80vh] overflow-hidden"
          >
            <div className="px-5 pt-4 pb-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-lg">Criar publicação</h2>
                  <p className="text-xs text-muted-foreground">O que você deseja compartilhar?</p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fechar"
                  className="h-8 w-8 grid place-items-center rounded-full bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="h-1 w-10 rounded-full bg-border mx-auto" />

              <div className="grid grid-cols-3 gap-3">
                {CREATE_ACTIONS.map((action, i) => (
                  <CreateSheetItem
                    key={action.id}
                    emoji={action.emoji}
                    label={action.label}
                    description={action.description}
                    index={i}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
