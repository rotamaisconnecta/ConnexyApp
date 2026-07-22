import { useState, useCallback } from 'react';
import { MarketplaceService } from '@/services/marketplace-service';

interface MarketplaceFilters {
  category?: string;
  search?: string;
}

export function useMarketplace() {
  const [businesses, setBusinesses] = useState<unknown[]>([]);
  const [events, setEvents] = useState<unknown[]>([]);
  const [offers, setOffers] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<MarketplaceFilters>({});

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [bizResult, eventsResult, offersResult] = await Promise.all([
        MarketplaceService.getBusinesses(filters),
        MarketplaceService.getEvents(filters),
        MarketplaceService.getOffers(filters),
      ]);
      setBusinesses(bizResult);
      setEvents(eventsResult);
      setOffers(offersResult);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  return {
    businesses,
    events,
    offers,
    isLoading,
    filters,
    setFilters,
    refresh,
  };
}
