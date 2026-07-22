import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { DriverFinance } from "@/components/driver/driver-finance";
import { ChevronLeft } from "lucide-react";
import type { DriverFinanceEntry } from "@/lib/driver/driver-types";

export const Route = createFileRoute("/_app/driver/finance")({
  head: () => ({ meta: [{ title: "Financeiro — Motorista" }] }),
  component: DriverFinancePage,
});

const MOCK_ENTRIES: DriverFinanceEntry[] = [
  {
    id: "f1",
    date: new Date(Date.now() - 86400000),
    description: "Corrida — Ana Silva",
    amount: 18.9,
    type: "credit",
  },
  {
    id: "f2",
    date: new Date(Date.now() - 86400000),
    description: "Comissão Connexy (20%)",
    amount: 3.78,
    type: "debit",
  },
  {
    id: "f3",
    date: new Date(Date.now() - 172800000),
    description: "Corrida — Carlos Souza",
    amount: 28.5,
    type: "credit",
  },
  {
    id: "f4",
    date: new Date(Date.now() - 172800000),
    description: "Comissão Connexy (20%)",
    amount: 5.7,
    type: "debit",
  },
  {
    id: "f5",
    date: new Date(Date.now() - 259200000),
    description: "Saque PIX",
    amount: 150,
    type: "debit",
  },
];

function DriverFinancePage() {
  return (
    <div className="flex-1 pb-20">
      <StatusBar />
      <header className="px-5 pt-1 pb-3 flex items-center gap-3">
        <Link to="/driver" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display font-bold text-lg">Financeiro</h1>
      </header>
      <div className="px-4">
        <DriverFinance balance={542.3} entries={MOCK_ENTRIES} pixKey="ana@email.com" />
      </div>
    </div>
  );
}
