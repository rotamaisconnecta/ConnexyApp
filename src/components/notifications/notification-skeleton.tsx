import { motion } from "framer-motion";

export function NotificationSkeleton() {
  const rows = Array.from({ length: 6 });

  return (
    <div className="flex flex-col gap-3 px-4">
      {rows.map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          className="flex items-center gap-3 rounded-2xl bg-[#F8F8FC] p-3"
        >
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#E7E7F2]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded-full bg-[#E7E7F2]" />
            <div className="h-2.5 w-1/2 rounded-full bg-[#E7E7F2]" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
