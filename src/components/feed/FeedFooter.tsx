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
      className="mx-4 py-6 text-center"
    >
      <p className="text-[11px] text-muted-foreground">{data.message}</p>
    </motion.div>
  );
}
