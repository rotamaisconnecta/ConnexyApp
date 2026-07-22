import type { Business } from "@/lib/marketplace/business-types";
import { BusinessCard } from "./business-card";
import { EmptyMarketplace } from "./empty-marketplace";

interface BusinessListProps {
  businesses: Business[];
  onSelect?: (id: string) => void;
}

export function BusinessList({ businesses, onSelect }: BusinessListProps) {
  if (businesses.length === 0) {
    return <EmptyMarketplace />;
  }

  return (
    <div className="space-y-3">
      {businesses.map((business) => (
        <BusinessCard key={business.id} business={business} onSelect={onSelect} />
      ))}
    </div>
  );
}
