import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/driver/driver-utils";
import type { DriverFinanceEntry } from "@/lib/driver/driver-types";

interface DriverFinanceProps {
  balance: number;
  entries: DriverFinanceEntry[];
  pixKey: string;
}

export function DriverFinance({ balance, entries, pixKey }: DriverFinanceProps) {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-brand p-5 text-white shadow-soft"
      >
        <div className="text-xs opacity-80">Saldo Disponível</div>
        <div className="text-3xl font-bold mt-1">{formatCurrency(balance)}</div>
        <div className="mt-3 flex gap-2">
          <button className="rounded-xl bg-white/20 px-4 py-2 text-xs font-semibold">
            Sacar via PIX
          </button>
          <button className="rounded-xl bg-white/20 px-4 py-2 text-xs font-semibold">
            Extrato
          </button>
        </div>
      </motion.div>

      <div className="rounded-2xl border border-border bg-surface p-3 shadow-soft">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Chave PIX
        </div>
        <div className="text-sm font-mono">{pixKey}</div>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-1">
          Histórico
        </div>
        {entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5"
          >
            <div>
              <div className="text-sm font-medium">{entry.description}</div>
              <div className="text-[10px] text-muted-foreground">
                {new Date(entry.date).toLocaleDateString("pt-BR")}
              </div>
            </div>
            <div
              className={`text-sm font-bold ${entry.type === "credit" ? "text-green-600" : "text-red-500"}`}
            >
              {entry.type === "credit" ? "+" : "-"}
              {formatCurrency(entry.amount)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
