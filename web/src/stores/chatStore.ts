import { create } from "zustand";
import { Channel, DirectMessage, Message, PaginatedResponse } from "@/types";
import { api } from "@/lib/api";

interface ChatState {
  channels: Channel[];
  directMessages: DirectMessage[];
  messages: Record<string, Message[]>;
  isLoading: boolean;
  hasMoreChannels: boolean;
  channelsAfterCursor: string | null;
  hasMoreDMs: boolean;
  dmsAfterCursor: string | null;

  // Channel operations
  fetchChannels: (loadMore?: boolean) => Promise<void>;
  createChannel: (name: string, projectId?: string) => Promise<Channel>;
  updateChannel: (id: string, data: Partial<Channel>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  toggleChannelStar: (id: string) => Promise<void>;

  // DM operations
  fetchDirectMessages: (loadMore?: boolean) => Promise<void>;
  createDirectMessage: (userId: string) => Promise<DirectMessage>;
  toggleDMStar: (id: string) => Promise<void>;

  // Message operations
  fetchMessages: (entityType: string, entityId: string) => Promise<void>;
  sendMessage: (
    entityType: string,
    entityId: string,
    text: string,
    parentId?: string,
    quoteId?: string,
  ) => Promise<Message>;
  updateMessage: (id: string, text: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  channels: [],
  directMessages: [],
  messages: {},
  isLoading: false,
  hasMoreChannels: true,
  channelsAfterCursor: null,
  hasMoreDMs: true,
  dmsAfterCursor: null,

  // Channel operations
  fetchChannels: async (loadMore = false) => {
    const { channelsAfterCursor, isLoading } = get();

    if (isLoading || (loadMore && !channelsAfterCursor)) return;

    set({ isLoading: true });
    try {
      const params: Record<string, string> = {};
      if (loadMore && channelsAfterCursor) {
        params.after = channelsAfterCursor;
      }

      const response = await api.get<PaginatedResponse<Channel>>(
        "/channels",
        params,
      );

      set((state) => ({
        channels: loadMore
          ? [...state.channels, ...response.data]
          : response.data,
        channelsAfterCursor: response.metadata.after,
        hasMoreChannels: response.metadata.after !== null,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch channels:", error);
      set({ channels: [], isLoading: false, hasMoreChannels: false });
    }
  },

  createChannel: async (name: string, projectId?: string) => {
    const channel = await api.post<Channel>("/channels", { name, projectId });
    set((state) => ({
      channels: [
        ...(Array.isArray(state.channels) ? state.channels : []),
        channel,
      ],
    }));
    return channel;
  },

  updateChannel: async (id: string, data: Partial<Channel>) => {
    const channel = await api.patch<Channel>(`/channels/${id}`, data);
    set((state) => ({
      channels: state.channels.map((c) => (c.id === id ? channel : c)),
    }));
  },

  deleteChannel: async (id: string) => {
    await api.delete(`/channels/${id}`);
    set((state) => ({
      channels: state.channels.filter((c) => c.id !== id),
    }));
  },

  toggleChannelStar: async (id: string) => {
    const channel = get().channels.find((c) => c.id === id);
    if (channel) {
      await get().updateChannel(id, { starred: !channel.starred });
    }
  },

  // DM operations
  fetchDirectMessages: async (loadMore = false) => {
    const { dmsAfterCursor, isLoading } = get();

    if (isLoading || (loadMore && !dmsAfterCursor)) return;

    set({ isLoading: true });
    try {
      const params: Record<string, string> = {};
      if (loadMore && dmsAfterCursor) {
        params.after = dmsAfterCursor;
      }

      const response = await api.get<PaginatedResponse<DirectMessage>>(
        "/direct_messages",
        params,
      );

      set((state) => ({
        directMessages: loadMore
          ? [...state.directMessages, ...response.data]
          : response.data,
        dmsAfterCursor: response.metadata.after,
        hasMoreDMs: response.metadata.after !== null,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch DMs:", error);
      set({ directMessages: [], isLoading: false, hasMoreDMs: false });
    }
  },

  createDirectMessage: async (userId: string) => {
    const dm = await api.post<DirectMessage>("/direct_messages", { userId });
    set((state) => ({ directMessages: [...state.directMessages, dm] }));
    return dm;
  },

  toggleDMStar: async (id: string) => {
    const dm = get().directMessages.find((d) => d.id === id);
    if (dm) {
      const updated = await api.patch<DirectMessage>(`/direct_messages/${id}`, {
        starred: !dm.starred,
      });
      set((state) => ({
        directMessages: state.directMessages.map((d) =>
          d.id === id ? updated : d,
        ),
      }));
    }
  },

  // Message operations
  fetchMessages: async (entityType: string, entityId: string) => {
    try {
      const messages = await api.get<Message[]>(
        `/messages?entity_type=${entityType}&entity_id=${entityId}`,
      );
      const key = `${entityType}:${entityId}`;
      set((state) => ({
        messages: { ...state.messages, [key]: messages },
      }));
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  },

  sendMessage: async (
    entityType: string,
    entityId: string,
    text: string,
    parentId?: string,
    quoteId?: string,
  ) => {
    const message = await api.post<Message>("/messages", {
      message: {
        entityType,
        entityId,
        text,
        parentId,
        quoteId,
      },
    });
    const key = `${entityType}:${entityId}`;
    set((state) => ({
      messages: {
        ...state.messages,
        [key]: [...(state.messages[key] || []), message],
      },
    }));
    return message;
  },

  updateMessage: async (id: string, text: string) => {
    await api.patch(`/messages/${id}`, { text });
  },

  deleteMessage: async (id: string) => {
    await api.delete(`/messages/${id}`);
    set((state) => {
      const newMessages = { ...state.messages };
      Object.keys(newMessages).forEach((key) => {
        newMessages[key] = newMessages[key].filter((m) => m.id !== id);
      });
      return { messages: newMessages };
    });
  },

  addMessage: (message: Message) => {
    const key = `${message.entityType}:${message.entityId}`;
    set((state) => ({
      messages: {
        ...state.messages,
        [key]: [...(state.messages[key] || []), message],
      },
    }));
  },
}));
