import { useState, useCallback } from 'react';
import { ChatService } from '@/services/chat-service';

export function useChat() {
  const [conversations, setConversations] = useState<unknown[]>([]);
  const [messages, setMessages] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    setIsLoading(true);
    try {
      const result = await ChatService.sendMessage(conversationId, content);
      setMessages((prev) => [...prev, result]);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (conversationId: string) => {
    await ChatService.markAsRead(conversationId);
  }, []);

  const loadMore = useCallback(async () => {
    if (!activeConversation || isLoading) return;
    setIsLoading(true);
    try {
      const older = await ChatService.getMessages(activeConversation, messages.length);
      setMessages((prev) => [...older, ...prev]);
    } finally {
      setIsLoading(false);
    }
  }, [activeConversation, isLoading, messages.length]);

  return {
    conversations,
    messages,
    isLoading,
    sendMessage,
    markAsRead,
    loadMore,
    activeConversation,
    setActiveConversation,
  };
}
