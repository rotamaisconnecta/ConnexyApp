import { motion } from "framer-motion";

export function LoadingChat() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: 8 }).map((_, i) => {
        const isMe = i % 2 === 0;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              {!isMe && <div className="h-6 w-6 rounded-lg bg-muted animate-pulse" />}
              <div
                className={`rounded-2xl px-3 py-2.5 ${isMe ? "rounded-br-md" : "rounded-bl-md"}`}
              >
                <div className="space-y-1.5">
                  <div className={`h-3 rounded bg-muted animate-pulse ${isMe ? "w-24" : "w-32"}`} />
                  {!isMe && <div className="h-3 w-16 rounded bg-muted animate-pulse" />}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
