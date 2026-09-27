import { createFileRoute } from "@tanstack/react-router";
import { CatalogCreateForm } from "@/components/catalog/catalog-create-form";
import { CatalogKind } from "@/lib/catalog/local-catalog";

export const Route = createFileRoute("/_app/create/place")({
  head: () => ({ meta: [{ title: "Cadastrar local" }] }),
  component: CreatePlacePage,
});

function CreatePlacePage() {
  return <CatalogCreateForm kind={CatalogKind.PLACE} title="Cadastrar local" />;
}
