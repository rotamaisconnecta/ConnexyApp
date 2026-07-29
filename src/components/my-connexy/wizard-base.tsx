import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Colors, Radius, Shadows } from "@/theme";

export interface WizardStep {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface WizardBaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  gradient: string;
  steps: WizardStep[];
  onComplete: () => void;
  completeLabel?: string;
}

export default function WizardBase({
  open,
  onClose,
  title,
  icon,
  gradient,
  steps,
  onComplete,
  completeLabel = "Publicar",
}: WizardBaseProps) {
  const [step, setStep] = useState(0);
  const isLast = step === steps.length - 1;

  function handleNext() {
    if (isLast) {
      onComplete();
      return;
    }
    setStep((s) => s + 1);
  }

  function handleBack() {
    if (step === 0) {
      onClose();
      return;
    }
    setStep((s) => s - 1);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full sm:max-w-lg max-h-[90vh] overflow-hidden"
            style={{
              borderRadius: `${Radius.lg} ${Radius.lg} 0 0`,
              backgroundColor: Colors.background,
              boxShadow: Shadows.large,
            }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 text-white" style={{ background: gradient }}>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleBack}
                  className="w-8 h-8 rounded-full bg-white/20 grid place-items-center hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/20 grid place-items-center hover:bg-white/30 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <h2 className="text-lg font-bold">{title}</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    {steps.map((s, i) => (
                      <div
                        key={s.id}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          i <= step ? "bg-white" : "bg-white/30"
                        }`}
                        style={{ width: `${Math.max(20, 100 / steps.length - 4)}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "55vh" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Passo {step + 1} de {steps.length}
                  </p>
                  <h3 className="text-base font-bold mb-4" style={{ color: Colors.text.primary }}>
                    {steps[step].title}
                  </h3>
                  {steps[step].content}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t" style={{ borderColor: Colors.border }}>
              <button
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 py-3 text-white font-semibold text-sm"
                style={{
                  borderRadius: Radius.md,
                  background: gradient,
                  boxShadow: Shadows.floatingButton,
                }}
              >
                {isLast ? (
                  <>
                    <Check size={16} />
                    {completeLabel}
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
