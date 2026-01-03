import type { Conversation, Message } from "@shared/models/chat";

export interface IChatStorage {
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
}

const conversations: Conversation[] = [];
const messages: Message[] = [];
let nextConversationId = 1;
let nextMessageId = 1;

export const chatStorage: IChatStorage = {
  async getConversation(id: number) {
    return conversations.find((conversation) => conversation.id === id);
  },

  async getAllConversations() {
    return [...conversations].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async createConversation(title: string) {
    const conversation: Conversation = {
      id: nextConversationId++,
      title,
      createdAt: new Date(),
    };
    conversations.push(conversation);
    return conversation;
  },

  async deleteConversation(id: number) {
    const conversationIndex = conversations.findIndex((conversation) => conversation.id === id);
    if (conversationIndex >= 0) {
      conversations.splice(conversationIndex, 1);
    }

    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].conversationId === id) {
        messages.splice(i, 1);
      }
    }
  },

  async getMessagesByConversation(conversationId: number) {
    return messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async createMessage(conversationId: number, role: string, content: string) {
    const message: Message = {
      id: nextMessageId++,
      conversationId,
      role,
      content,
      createdAt: new Date(),
    };
    messages.push(message);
    return message;
  },
};
