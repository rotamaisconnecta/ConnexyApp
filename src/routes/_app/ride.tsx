import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/_app/ride")({
  validateSearch: z.object({
    destinationId: z.string().optional().nullable(),
    destinationName: z.string().optional().nullable(),
    destinationAddress: z.string().optional().nullable(),
    destinationLat: z.number().optional().nullable(),
    destinationLng: z.number().optional().nullable(),
    source: z.string().optional().nullable(),
  }),
  component: RideLayout,
});

function RideLayout() {
  return <Outlet />;
}
