import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { DriverPerformance } from "@/components/driver/driver-performance";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_app/driver/performance")({
  head: () => ({ meta: [{ title: "Desempenho — Motorista" }] }),
  component: DriverPerformancePage,
});

function DriverPerformancePage() {
  return (
    <div className="flex-1 pb-20">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <Link to="/driver" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display font-bold text-lg">Desempenho</h1>
      </header>
      <div className="px-4">
        <DriverPerformance rating={4.9} totalTrips={234} completionRate={97} acceptanceRate={89} />
      </div>
    </div>
  );
}
