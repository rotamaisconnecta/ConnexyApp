import { FeedRepository } from "@/repositories/feed.repository";

const MAX_POST_LENGTH = 2000;
const DEFAULT_PAGE_SIZE = 20;

export const FeedService = {
  async getFeed(page: number, pageSize: number = DEFAULT_PAGE_SIZE) {
    const offset = page * pageSize;
    const posts = await FeedRepository.getFeed(pageSize, offset);
    return posts;
  },

  async createPost(authorId: string, content: string) {
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      throw new Error("Post content cannot be empty");
    }
    if (trimmed.length > MAX_POST_LENGTH) {
      throw new Error(`Post must be ${MAX_POST_LENGTH} characters or less`);
    }

    const post = await FeedRepository.create({
      author_id: authorId,
      text: trimmed,
    });
    return post;
  },

  async deletePost(postId: string, authorId: string) {
    await FeedRepository.delete(postId, authorId);
  },

  async likePost(postId: string, userId: string) {
    const like = await FeedRepository.like(postId, userId);
    return like;
  },

  async unlikePost(postId: string, userId: string) {
    await FeedRepository.unlike(postId, userId);
  },
};
