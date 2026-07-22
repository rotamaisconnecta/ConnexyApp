import { motion } from "framer-motion";
import { sectionFade } from "@/components/profile/animations";
import type { FeedItem } from "@/lib/feed/feed-types";
import { PostCard } from "./cards/post-card";
import { MomentCard } from "./cards/moment-card";
import { PlaceCard } from "./cards/place-card";
import { EventCard } from "./cards/event-card";
import { OfferCard } from "./cards/offer-card";
import { RouteCard } from "./cards/route-card";
import { NetworkingCard } from "./cards/networking-card";

interface FeedSectionProps {
  items: FeedItem[];
  startIndex?: number;
}

export function FeedSection({ items, startIndex = 0 }: FeedSectionProps) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          variants={sectionFade(startIndex + i)}
          initial="hidden"
          animate="visible"
        >
          <CardRenderer item={item} />
        </motion.div>
      ))}
    </div>
  );
}

function CardRenderer({ item }: { item: FeedItem }) {
  switch (item.type) {
    case "POST":
      return <PostCard item={item} />;
    case "MOMENT":
      return <MomentCard item={item} />;
    case "PLACE":
      return <PlaceCard item={item} />;
    case "EVENT":
      return <EventCard item={item} />;
    case "OFFER":
      return <OfferCard item={item} />;
    case "ROUTE":
      return <RouteCard item={item} />;
    case "NETWORKING":
      return <NetworkingCard item={item} />;
    default:
      return null;
  }
}
