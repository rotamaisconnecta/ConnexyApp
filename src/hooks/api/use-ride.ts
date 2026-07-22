import { useState, useCallback } from 'react';
import { RideService } from '@/services/ride-service';

export function useRide() {
  const [activeRide, setActiveRide] = useState<unknown>(null);
  const [history, setHistory] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [activeResult, historyResult] = await Promise.all([
        RideService.getActiveRide(),
        RideService.getRideHistory(),
      ]);
      setActiveRide(activeResult);
      setHistory(historyResult);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestRide = useCallback(async (data: unknown) => {
    setIsLoading(true);
    try {
      const result = await RideService.requestRide(data);
      setActiveRide(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (rideId: string, status: string) => {
    setIsLoading(true);
    try {
      const result = await RideService.updateStatus(rideId, status);
      setActiveRide(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rateRide = useCallback(async (rideId: string, rating: number, comment?: string) => {
    setIsLoading(true);
    try {
      return await RideService.rateRide(rideId, rating, comment);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    activeRide,
    history,
    isLoading,
    requestRide,
    updateStatus,
    rateRide,
    refresh,
  };
}
