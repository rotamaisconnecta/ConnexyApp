import { createFileRoute } from "@tanstack/react-router";
import { CatalogCreateForm } from "@/components/catalog/catalog-create-form";
import { CatalogKind } from "@/lib/catalog/local-catalog";

export const Route = createFileRoute("/_app/create/event")({
  head: () => ({ meta: [{ title: "Criar evento" }] }),
  component: CreateEventPage,
});

function CreateEventPage() {
  return <CatalogCreateForm kind={CatalogKind.EVENT} title="Criar evento" />;
}
