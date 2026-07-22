import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { sheetOverlay, sheetContainer } from "./navigation-animations";
import { CreateSheetItem } from "./create-sheet-item";
import { CREATE_ACTIONS } from "@/lib/navigation/navigation-items";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
} as const;

const sheetVariants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { type: "spring" as const, damping: 30, stiffness: 300 },
  },
  exit: {
    y: "100%",
    transition: { type: "spring" as const, damping: 35, stiffness: 300 },
  },
};

const gridContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.15 },
  },
};

interface CreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (category: string) => void;
}

export function CreateSheet({ isOpen, onClose, onSelect }: CreateSheetProps) {
  function handleSelect(category: string) {
    onSelect?.(category);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-label="Criar publicação"
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-[36px] max-h-[90vh] overflow-hidden"
            style={{
              paddingBottom: "env(safe-area-inset-bottom)",
              paddingTop: "env(safe-area-inset-top)",
            }}
          >
            <div className="flex h-full flex-col">
              <div className="shrink-0 px-6 pt-3 pb-2">
                <div className="flex justify-center pb-2">
                  <div className="h-1 w-10 rounded-full bg-border" />
                </div>
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
              </div>

              <div className="overflow-y-auto overscroll-contain scroll-smooth pb-10 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <motion.div
                  variants={gridContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 gap-5 sm:grid-cols-3"
                >
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
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
