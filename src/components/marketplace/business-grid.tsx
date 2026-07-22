import type { Business } from "@/lib/marketplace/business-types";
import { BusinessCard } from "./business-card";

interface BusinessGridProps {
  businesses: Business[];
  onSelect?: (id: string) => void;
}

export function BusinessGrid({ businesses, onSelect }: BusinessGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {businesses.map((business) => (
        <BusinessCard key={business.id} business={business} onSelect={onSelect} />
      ))}
    </div>
  );
}
