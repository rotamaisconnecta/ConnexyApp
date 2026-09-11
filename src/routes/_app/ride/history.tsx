import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/ride/history")({
  component: RideHistoryLayout,
});

function RideHistoryLayout() {
  return <Outlet />;
}
