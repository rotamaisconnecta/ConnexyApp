import { motion } from "framer-motion";

export function ReelLoading() {
  return (
    <div className="relative h-full w-full snap-start shrink-0 bg-[#0a0a0a] overflow-hidden">
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-0"
      >
        <div className="absolute inset-0 bg-[#1a1a1a]" />
        <div className="absolute bottom-4 left-4 right-4 z-10 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/10" />
            <div className="h-4 w-32 rounded-full bg-white/10" />
          </div>
          <div className="h-3 w-3/4 rounded-full bg-white/10" />
          <div className="h-3 w-1/2 rounded-full bg-white/10" />
        </div>
        <div className="absolute right-2 bottom-32 z-10 flex flex-col items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-white/10" />
          <div className="h-11 w-11 rounded-full bg-white/10" />
          <div className="h-11 w-11 rounded-full bg-white/10" />
          <div className="h-11 w-11 rounded-full bg-white/10" />
        </div>
      </motion.div>
    </div>
  );
}
