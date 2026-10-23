import { type ReactNode } from "react";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
import { PublisherLayout } from "@/components/publisher/PublisherLayout";
import { cn } from "@/lib/utils";
import {
  AD_CREATE_STEPS,
  getAdCreateStepIndex,
  isReviewStep,
  type AdCreateStepId,
} from "./ad-create-steps";

/**
 * Apenas controla apresentação: o conteúdo permanece montado, então nenhum
 * estado do formulário é destruído ao trocar de etapa.
 */
export function AdStepSection({
  step,
  activeStep,
  children,
}: {
  step: AdCreateStepId;
  activeStep: AdCreateStepId;
  children: ReactNode;
}) {
  return <div className={step === activeStep ? "block" : "hidden"}>{children}</div>;
}

export function AdCreateStepNav({
  step,
  onStepChange,
  canReview = true,
}: {
  step: AdCreateStepId;
  onStepChange: (next: AdCreateStepId) => void;
  canReview?: boolean;
}) {
  const activeIndex = getAdCreateStepIndex(step);

  return (
    <nav aria-label="Etapas da criação" className="shrink-0 border-b border-border/50">
      <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 lg:px-6">
        {AD_CREATE_STEPS.map((item, index) => {
          const active = item.id === step;
          const done = index < activeIndex;
          const blocked = !canReview && isReviewStep(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "step" : undefined}
              aria-disabled={blocked || undefined}
              disabled={blocked}
              onClick={() => {
                if (blocked) return;
                onStepChange(item.id);
              }}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                active
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : done
                    ? "border-border bg-secondary/50 text-foreground/70 hover:bg-secondary"
                    : "border-border/60 bg-background/70 text-muted-foreground hover:bg-secondary/40",
                blocked && "cursor-not-allowed opacity-45 hover:bg-background/70",
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="h-0.5 w-full bg-secondary/60">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((activeIndex + 1) / AD_CREATE_STEPS.length) * 100}%` }}
        />
      </div>
    </nav>
  );
}

export function AdCreateShell({
  title,
  step,
  onStepChange,
  canReview = true,
  children,
}: {
  title: string;
  step: AdCreateStepId;
  onStepChange: (next: AdCreateStepId) => void;
  canReview?: boolean;
  children: ReactNode;
}) {
  return (
    <PublisherLayout>
      {/* Sem botão no cabeçalho: publicar é a última etapa, não uma ação de permanência. */}
      <PublisherHeader title={title} />
      <AdCreateStepNav step={step} onStepChange={onStepChange} canReview={canReview} />

      {/* A prévia não compete com os campos: o formulário ocupa a largura toda. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6">
        <div className="mx-auto w-full max-w-2xl pb-2">{children}</div>
      </div>
    </PublisherLayout>
  );
}
