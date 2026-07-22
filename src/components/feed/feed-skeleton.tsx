import { motion } from "framer-motion";

export function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-3xl border border-border bg-surface p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
              <div className="h-2 w-16 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
          </div>
          <div className="mt-3 h-40 w-full rounded-2xl bg-muted animate-pulse" />
        </motion.div>
      ))}
    </div>
  );
}
