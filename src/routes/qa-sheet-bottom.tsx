import { createFileRoute } from "@tanstack/react-router";
import { BottomSheet } from "@/components/system/bottom-sheet";

export const Route = createFileRoute("/qa-sheet-bottom")({
  component: QaSheetBottom,
});

function QaSheetBottom() {
  return (
    <div className="mx-auto w-full bg-background">
      <BottomSheet isOpen onClose={() => {}} title="Sheet longo" snap="FULL">
        {Array.from({ length: 60 }, (_, i) => (
          <p key={i} className="mb-2 text-sm text-muted-foreground">
            Ítem do sheet número {i + 1} para validar rolagem interna e final acessível.
          </p>
        ))}
        <button className="mt-2 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground">
          CTA final do sheet
        </button>
      </BottomSheet>
    </div>
  );
}