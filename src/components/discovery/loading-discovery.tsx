import { motion } from "framer-motion";

export function LoadingDiscovery() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-3xl border border-border bg-surface p-3"
        >
          <div className="h-32 w-full rounded-2xl bg-muted animate-pulse" />
          <div className="mt-2 space-y-1.5">
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            <div className="h-2 w-16 rounded bg-muted animate-pulse" />
            <div className="h-2 w-24 rounded bg-muted animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
