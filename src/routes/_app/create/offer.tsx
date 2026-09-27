import { createFileRoute } from "@tanstack/react-router";
import { CatalogCreateForm } from "@/components/catalog/catalog-create-form";
import { CatalogKind } from "@/lib/catalog/local-catalog";

export const Route = createFileRoute("/_app/create/offer")({
  head: () => ({ meta: [{ title: "Criar oferta" }] }),
  component: CreateOfferPage,
});

function CreateOfferPage() {
  return <CatalogCreateForm kind={CatalogKind.OFFER} title="Criar oferta" />;
}
