import { useState, useCallback } from "react";
import { FeedService } from "@/services/feed.service";

export function useFeed() {
  const [items, setItems] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await FeedService.getFeed(1);
      setItems(result);
      setHasMore(result.length > 0);
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
      setItems((prev) => [...prev, ...result]);
      setHasMore(result.length > 0);
      setPage(nextPage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page]);

  const createPost = useCallback(async (data: unknown) => {
    const { authorId, content } = data as { authorId: string; content: string };
    const result = await FeedService.createPost(authorId, content);
    setItems((prev) => [result, ...prev]);
    return result;
  }, []);

  const deletePost = useCallback(
    async (postId: string) => {
      const firstItem = items[0] as { author_id?: string } | undefined;
      const authorId = firstItem?.author_id ?? "";
      await FeedService.deletePost(postId, authorId);
      setItems((prev) =>
        prev.filter((item: unknown) => {
          if (typeof item === "object" && item !== null && "id" in item) {
            return (item as { id: string }).id !== postId;
          }
          return true;
        }),
      );
    },
    [items],
  );

  const likePost = useCallback(async (postId: string, userId: string) => {
    await FeedService.likePost(postId, userId);
  }, []);

  const unlikePost = useCallback(async (postId: string, userId: string) => {
    await FeedService.unlikePost(postId, userId);
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
