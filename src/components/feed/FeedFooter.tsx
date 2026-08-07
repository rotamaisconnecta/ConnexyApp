import { motion } from "framer-motion";
import type { FooterSectionData } from "@/lib/feed/feed-types";

interface FeedFooterProps {
  data: FooterSectionData;
}

export function FeedFooter({ data }: FeedFooterProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="px-6 pt-6 text-center"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
    >
      <div className="mx-auto mb-3 h-px w-16 bg-border" />
      <p className="font-display text-sm font-bold text-foreground">
        Connexy — Conectando pessoas, lugares e momentos
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{data.message}</p>
    </motion.div>
  );
}
