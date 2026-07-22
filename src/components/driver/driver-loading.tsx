import { motion } from "framer-motion";

export function DriverLoading() {
  return (
    <div className="space-y-4 px-4 pt-4">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-12 w-12 rounded-full bg-gray-200"
        />
        <div className="space-y-2 flex-1">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            className="h-4 w-32 rounded-lg bg-gray-200"
          />
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            className="h-3 w-20 rounded-lg bg-gray-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            className="h-20 rounded-2xl bg-gray-200"
          />
        ))}
      </div>

      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        className="h-48 rounded-2xl bg-gray-200"
      />
    </div>
  );
}
