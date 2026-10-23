import { createFileRoute } from "@tanstack/react-router";
import { EventCreateForm } from "@/components/catalog/event-create-form";

export const Route = createFileRoute("/_app/create/event")({
  head: () => ({ meta: [{ title: "Criar evento" }] }),
  component: CreateEventPage,
});

function CreateEventPage() {
  return <EventCreateForm />;
}
