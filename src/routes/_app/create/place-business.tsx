import { createFileRoute } from "@tanstack/react-router";
import { CatalogCreateForm } from "@/components/catalog/catalog-create-form";
import { CatalogKind } from "@/lib/catalog/local-catalog";

export const Route = createFileRoute("/_app/create/place-business")({
  head: () => ({ meta: [{ title: "Criar negócio" }] }),
  component: CreateBusinessPage,
});

function CreateBusinessPage() {
  return <CatalogCreateForm kind={CatalogKind.BUSINESS} title="Criar negócio" />;
}
