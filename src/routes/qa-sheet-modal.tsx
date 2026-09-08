import { createFileRoute } from "@tanstack/react-router";
import { Modal } from "@/components/system/modal";
import { ModalSize } from "@/lib/system/system-types";

export const Route = createFileRoute("/qa-sheet-modal")({
  component: QaSheetModal,
});

function QaSheetModal() {
  return (
    <div className="mx-auto w-full bg-background">
      <Modal isOpen onClose={() => {}} title="Modal longo — validar scroll" size={ModalSize.SM}>
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i} className="mb-2 text-sm text-muted-foreground">
            Linha de conteúdo número {i + 1} do modal para confirmar rolagem interna e CTA
            inferior alcançável.
          </p>
        ))}
        <button className="mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground">
          Confirmar (CTA inferior)
        </button>
      </Modal>
    </div>
  );
}