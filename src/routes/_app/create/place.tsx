import { createFileRoute } from "@tanstack/react-router";
import { PlaceCreateForm } from "@/components/catalog/place-create-form";

export const Route = createFileRoute("/_app/create/place")({
  head: () => ({ meta: [{ title: "Cadastrar local" }] }),
  component: CreatePlacePage,
});

function CreatePlacePage() {
  return <PlaceCreateForm />;
}
