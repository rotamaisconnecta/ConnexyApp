import { motion } from "framer-motion";
import { PersonCard } from "./person-card";
import type { DiscoveryPerson } from "@/lib/discovery/discovery-types";

interface PeopleGridProps {
  people: DiscoveryPerson[];
  onConnect: (id: string) => void;
  onFavorite: (id: string) => void;
  onIgnore: (id: string) => void;
  connectedIds: Set<string>;
  favoritedIds: Set<string>;
}

const container = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export function PeopleGrid({
  people,
  onConnect,
  onFavorite,
  onIgnore,
  connectedIds,
  favoritedIds,
}: PeopleGridProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3"
    >
      {people.map((person) => (
        <motion.div key={person.id} variants={item}>
          <PersonCard
            person={person}
            onConnect={onConnect}
            onFavorite={onFavorite}
            onIgnore={onIgnore}
            connected={connectedIds.has(person.id)}
            favorited={favoritedIds.has(person.id)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
