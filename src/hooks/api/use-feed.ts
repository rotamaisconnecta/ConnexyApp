import { useState, useCallback } from 'react';
import { FeedService } from '@/services/feed-service';

export function useFeed() {
  const [items, setItems] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await FeedService.getFeed(1);
      setItems(result.items);
      setHasMore(result.hasMore);
      setPage(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const result = await FeedService.getFeed(nextPage);
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page]);

  const createPost = useCallback(async (data: unknown) => {
    const result = await FeedService.createPost(data);
    setItems((prev) => [result, ...prev]);
    return result;
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    await FeedService.deletePost(postId);
    setItems((prev) => prev.filter((item: unknown) => {
      if (typeof item === 'object' && item !== null && 'id' in item) {
        return (item as { id: string }).id !== postId;
      }
      return true;
    }));
  }, []);

  const likePost = useCallback(async (postId: string) => {
    await FeedService.likePost(postId);
  }, []);

  const unlikePost = useCallback(async (postId: string) => {
    await FeedService.unlikePost(postId);
  }, []);

  return {
    items,
    isLoading,
    hasMore,
    loadMore,
    createPost,
    deletePost,
    likePost,
    unlikePost,
    refresh,
  };
}
