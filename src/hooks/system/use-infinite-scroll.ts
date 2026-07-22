import { useState, useEffect, useRef, useCallback } from "react";
import { isAtBottom } from "@/lib/system/scroll-utils";

interface UseInfiniteScrollReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
}

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 100,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || isLoading || !hasMore) return;
    if (isAtBottom(el, threshold)) {
      onLoadMore();
    }
  }, [isLoading, hasMore, onLoadMore, threshold]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) onLoadMore();
  }, [isLoading, hasMore, onLoadMore]);

  return { containerRef, hasMore, isLoading, loadMore };
}
