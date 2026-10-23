import { createFileRoute } from "@tanstack/react-router";
import { BusinessCreateForm } from "@/components/catalog/business-create-form";

export const Route = createFileRoute("/_app/create/place-business")({
  head: () => ({ meta: [{ title: "Criar negócio" }] }),
  component: CreateBusinessPage,
});

function CreateBusinessPage() {
  return <BusinessCreateForm />;
}
