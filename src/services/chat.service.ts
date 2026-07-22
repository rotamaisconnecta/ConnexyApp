import { ChatRepository } from "@/repositories/chat.repository";

const MAX_MESSAGE_LENGTH = 5000;
const DEFAULT_PAGE_SIZE = 50;

export const ChatService = {
  async getConversations(userId: string) {
    const conversations = await ChatRepository.getConversations(userId);
    return conversations;
  },

  async getMessages(conversationId: string, page: number) {
    const offset = page * DEFAULT_PAGE_SIZE;
    const messages = await ChatRepository.getMessages(conversationId, offset, DEFAULT_PAGE_SIZE);
    return messages;
  },

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      throw new Error("Message cannot be empty");
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message must be ${MAX_MESSAGE_LENGTH} characters or less`);
    }

    const message = await ChatRepository.sendMessage(conversationId, senderId, trimmed);
    return message;
  },

  async markAsRead(conversationId: string, userId: string) {
    await ChatRepository.markAsRead(conversationId, userId);
  },

  async startConversation(participantIds: string[]) {
    if (participantIds.length < 2) {
      throw new Error("A conversation requires at least 2 participants");
    }

    const uniqueIds = [...new Set(participantIds)];
    const conversation = await ChatRepository.createConversation(uniqueIds);
    return conversation;
  },
};
