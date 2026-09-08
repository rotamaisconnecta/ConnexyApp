import { createFileRoute } from "@tanstack/react-router";
import { CreateSheet } from "@/components/navigation/create-sheet";

export const Route = createFileRoute("/qa-sheet-create")({
  component: QaSheetCreate,
});

function QaSheetCreate() {
  return (
    <div className="mx-auto w-full bg-background">
      <CreateSheet isOpen onClose={() => {}} />
    </div>
  );
}