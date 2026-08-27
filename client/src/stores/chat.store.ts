import { create } from 'zustand';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from './auth.store';

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: string;
  attachments?: any[];
  reactions?: { emoji: string; userId: string; username: string }[];
  isPinned?: boolean;
  isDeleted?: boolean;
  isForwarded?: boolean;
  isSent?: boolean;
  isMyMessage?: boolean;
  timestamp?: string;
  replyTo?: any;
  createdAt: string;
  readBy?: string[];
}

export interface ConversationItemData {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string;
  avatar: string;
  creatorId?: string;
  lastMessage?: string;
  timestamp?: string;
  unread: number;
  isOnline: boolean;
  members?: any[];
  pinnedMessage?: any;
}

export type Message = ChatMessageItem;
export type Conversation = ConversationItemData;

export const getCurrentUserId = (): string => {
  if (typeof window === 'undefined') return '';
  const authUser = useAuthStore.getState().user;
  if (authUser?.id) return authUser.id;
  try {
    const userStr = localStorage.getItem('user') || localStorage.getItem('user_data');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      return parsed.id || parsed._id || '';
    }
  } catch {}
  return '';
};

const formatMessage = (m: any, currentUserId: string): ChatMessageItem => {
  const senderId = m.senderId?._id ? m.senderId._id.toString() : (m.senderId ? m.senderId.toString() : '');
  const isMine = !!currentUserId && senderId === currentUserId;

  return {
    id: m._id || m.id,
    senderId,
    senderName: m.senderId?.displayName || 'User',
    senderAvatar: m.senderId?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
    content: m.content || '',
    type: m.type || 'TEXT',
    attachments: m.attachments || [],
    reactions: m.reactions || [],
    isPinned: m.isPinned || false,
    isDeleted: m.isDeleted || false,
    isForwarded: m.isForwarded || false,
    isSent: isMine,
    isMyMessage: isMine,
    replyTo: m.replyTo,
    timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    createdAt: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    readBy: m.readBy || [],
  };
};

interface ChatState {
  conversations: ConversationItemData[];
  activeConversationId: string | null;
  messages: { [conversationId: string]: ChatMessageItem[] };
  messagePagination: { [conversationId: string]: { page: number; hasMore: boolean } };
  typingUsers: { [conversationId: string]: string | null };
  replyingTo: ChatMessageItem | null;
  forwardingMessage: ChatMessageItem | null;
  onlineUserIds: string[];

  // Actions
  fetchConversations: () => Promise<void>;
  selectConversation: (id: string | null) => Promise<void>;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  createDirectConversation: (recipientId: string) => Promise<string>;
  createGroupConversation: (title: string, memberIds: string[]) => Promise<string>;
  addGroupMembers: (conversationId: string, memberIds: string[]) => Promise<void>;
  renameGroup: (conversationId: string, title: string) => Promise<void>;
  leaveGroup: (conversationId: string) => Promise<void>;
  deleteConversationForMe: (conversationId: string) => Promise<void>;
  deleteGroupPermanently: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, type?: string, attachments?: any[]) => void;
  unsendMessage: (messageId: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  unpinMessage: () => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  setReplyingTo: (msg: ChatMessageItem | null) => void;
  setForwardingMessage: (msg: ChatMessageItem | null) => void;
  forwardMessageTo: (targetConversationId: string) => Promise<void>;
  blockUser: (targetUserId: string) => Promise<void>;
  
  // Realtime handlers
  receiveSocketMessage: (message: any) => void;
  receiveUnsentMessage: (data: { messageId: string; conversationId: string }) => void;
  receivePinnedMessage: (data: { conversationId: string; pinnedMessage: any }) => void;
  receiveUnpinnedMessage: (data: { conversationId: string }) => void;
  receiveReaction: (data: { messageId: string; conversationId: string; reactions: any[] }) => void;
  receiveReadReceipt: (data: { conversationId: string; userId: string }) => void;
  setUserPresence: (userId: string, isOnline: boolean) => void;
  setTyping: (conversationId: string, username: string | null) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  clearChatState: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  messagePagination: {},
  typingUsers: {},
  replyingTo: null,
  forwardingMessage: null,
  onlineUserIds: [],

  fetchConversations: async () => {
    try {
      const { data } = await api.get('/conversations');
      const currentUserId = getCurrentUserId();

      const formatted: ConversationItemData[] = (data || []).map((c: any) => {
        let name = c.title;
        let avatar = c.avatar;
        let isOnline = false;

        if (c.type === 'DIRECT') {
          const other = (c.members || []).find((m: any) => (m._id?.toString() || m.toString()) !== currentUserId) || c.members?.[0];
          name = other?.displayName || 'User';
          avatar = other?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Direct';
          isOnline = get().onlineUserIds.includes(other?._id?.toString() || other?.toString());
        }

        return {
          id: c._id,
          type: c.type,
          name,
          avatar,
          creatorId: c.creatorId?.toString() || c.creatorId,
          lastMessage: c.lastMessage?.content || (c.lastMessage?.type === 'IMAGE' ? '📷 Photo' : c.lastMessage?.type === 'AUDIO' ? '🎤 Voice Message' : c.lastMessage?.type === 'FILE' ? '📁 Document' : ''),
          timestamp: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          unread: 0,
          isOnline,
          members: c.members,
          pinnedMessage: c.pinnedMessage,
        };
      });

      set({ conversations: formatted });
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  },

  selectConversation: async (id: string | null) => {
    if (!id) {
      set({ activeConversationId: null, replyingTo: null });
      return;
    }
    set({ activeConversationId: id, replyingTo: null });
    const currentUserId = getCurrentUserId();

    // Join socket room
    const socket = getSocket();
    socket.emit('room:join', { conversationId: id });

    try {
      const { data } = await api.get(`/messages/${id}?page=1&limit=50`);
      const msgList = Array.isArray(data) ? data : (data.messages || []);
      const formatted = msgList.map((m: any) => formatMessage(m, currentUserId));
      const hasMore = !!(data?.hasMore ?? data?.pagination?.hasMore ?? false);

      set((state) => ({
        messages: { ...state.messages, [id]: formatted },
        messagePagination: { ...state.messagePagination, [id]: { page: 1, hasMore } },
      }));

      api.post(`/messages/${id}/read`).catch(() => {});
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  },

  loadMoreMessages: async (conversationId: string) => {
    const currentPagination = get().messagePagination[conversationId];
    if (!currentPagination || !currentPagination.hasMore) return;

    try {
      const nextPage = currentPagination.page + 1;
      const { data } = await api.get(`/messages/${conversationId}?page=${nextPage}&limit=30`);
      const currentUserId = getCurrentUserId();
      const msgList = Array.isArray(data) ? data : (data.messages || []);
      const olderMessages = msgList.map((m: any) => formatMessage(m, currentUserId));
      const hasMore = !!(data?.hasMore ?? data?.pagination?.hasMore ?? false);

      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [...olderMessages, ...(state.messages[conversationId] || [])],
        },
        messagePagination: {
          ...state.messagePagination,
          [conversationId]: { page: nextPage, hasMore },
        },
      }));
    } catch (err) {
      console.error('Failed to load older messages:', err);
    }
  },

  createDirectConversation: async (recipientId: string) => {
    const { data } = await api.post('/conversations/direct', { recipientId });
    await get().fetchConversations();
    get().selectConversation(data._id);
    return data._id;
  },

  createGroupConversation: async (title: string, memberIds: string[]) => {
    const { data } = await api.post('/conversations/group', { title, memberIds });
    await get().fetchConversations();
    get().selectConversation(data._id);
    return data._id;
  },

  addGroupMembers: async (conversationId: string, memberIds: string[]) => {
    await api.post(`/conversations/${conversationId}/members`, { memberIds });
    await get().fetchConversations();
    await get().selectConversation(conversationId);
  },

  renameGroup: async (conversationId: string, title: string) => {
    await api.patch(`/conversations/${conversationId}/title`, { title });
    await get().fetchConversations();
  },

  leaveGroup: async (conversationId: string) => {
    await api.delete(`/conversations/${conversationId}/leave`);
    set({ activeConversationId: null });
    await get().fetchConversations();
  },

  deleteConversationForMe: async (conversationId: string) => {
    await api.delete(`/conversations/${conversationId}/for-me`);
    set((state) => ({
      activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
      conversations: state.conversations.filter((c) => c.id !== conversationId),
    }));
  },

  deleteGroupPermanently: async (conversationId: string) => {
    await api.delete(`/conversations/${conversationId}`);
    set((state) => ({
      activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
      conversations: state.conversations.filter((c) => c.id !== conversationId),
    }));
  },

  sendMessage: (content: string, type = 'TEXT', attachments = []) => {
    const activeId = get().activeConversationId;
    if (!activeId) return;

    const socket = getSocket();
    const replyTo = get().replyingTo;

    socket.emit('message:send', {
      conversationId: activeId,
      content,
      type,
      attachments,
      replyTo: replyTo ? replyTo.id : undefined,
    });

    set({ replyingTo: null });
  },

  unsendMessage: async (messageId: string) => {
    const activeId = get().activeConversationId;
    if (!activeId) return;
    const socket = getSocket();
    socket.emit('message:unsend', { messageId, conversationId: activeId });
  },

  pinMessage: async (messageId: string) => {
    const activeId = get().activeConversationId;
    if (!activeId) return;
    const socket = getSocket();
    socket.emit('message:pin', { messageId, conversationId: activeId });
  },

  unpinMessage: async () => {
    const activeId = get().activeConversationId;
    if (!activeId) return;
    const socket = getSocket();
    socket.emit('message:unpin', { conversationId: activeId });
  },

  toggleReaction: async (messageId: string, emoji: string) => {
    const activeId = get().activeConversationId;
    if (!activeId) return;
    const socket = getSocket();
    socket.emit('message:reaction', { messageId, conversationId: activeId, emoji });
  },

  reactToMessage: async (messageId: string, emoji: string) => {
    const activeId = get().activeConversationId;
    if (!activeId) return;
    const socket = getSocket();
    socket.emit('message:reaction', { messageId, conversationId: activeId, emoji });
  },

  setReplyingTo: (msg: ChatMessageItem | null) => set({ replyingTo: msg }),
  setForwardingMessage: (msg: ChatMessageItem | null) => set({ forwardingMessage: msg }),

  forwardMessageTo: async (targetConversationId: string) => {
    const msg = get().forwardingMessage;
    if (!msg) return;

    try {
      await api.post('/messages/forward', {
        originalMessageId: msg.id,
        targetConversationIds: [targetConversationId],
      });
      set({ forwardingMessage: null });
      await get().selectConversation(targetConversationId);
    } catch (err) {
      console.error('Failed to forward message:', err);
    }
  },

  blockUser: async (targetUserId: string) => {
    try {
      await api.post(`/users/block/${targetUserId}`);
      await get().fetchConversations();
    } catch (err) {
      console.error('Failed to block user:', err);
    }
  },

  receiveSocketMessage: (message: any) => {
    const currentUserId = getCurrentUserId();
    const formatted = formatMessage(message, currentUserId);
    const convId = (message.conversationId?._id ? message.conversationId._id.toString() : message.conversationId?.toString()) || message.conversationId;

    set((state) => {
      const convMessages = state.messages[convId] || [];
      const isAlreadyExists = convMessages.some((m) => m.id === formatted.id);
      const newMessages = isAlreadyExists ? convMessages : [...convMessages, formatted];

      const updatedConversations = state.conversations.map((c) => {
        if (c.id === convId) {
          return {
            ...c,
            lastMessage: message.content || (message.type === 'IMAGE' ? '📷 Photo' : message.type === 'AUDIO' ? '🎤 Voice Message' : message.type === 'FILE' ? '📁 Document' : ''),
            timestamp: formatted.createdAt,
          };
        }
        return c;
      });

      return {
        messages: { ...state.messages, [convId]: newMessages },
        conversations: updatedConversations,
      };
    });

    if (get().activeConversationId === convId) {
      api.post(`/messages/${convId}/read`).catch(() => {});
    }
  },

  receiveUnsentMessage: ({ messageId, conversationId }) => {
    set((state) => {
      const convMessages = state.messages[conversationId] || [];
      const updated = convMessages.map((m) =>
        m.id === messageId ? { ...m, isDeleted: true, content: 'Tin nhắn đã được thu hồi' } : m
      );
      return { messages: { ...state.messages, [conversationId]: updated } };
    });
  },

  receivePinnedMessage: ({ conversationId, pinnedMessage }) => {
    set((state) => {
      const updatedConversations = state.conversations.map((c) =>
        c.id === conversationId ? { ...c, pinnedMessage } : c
      );
      return { conversations: updatedConversations };
    });
  },

  receiveUnpinnedMessage: ({ conversationId }) => {
    set((state) => {
      const updatedConversations = state.conversations.map((c) =>
        c.id === conversationId ? { ...c, pinnedMessage: null } : c
      );
      return { conversations: updatedConversations };
    });
  },

  receiveReaction: ({ messageId, conversationId, reactions }) => {
    set((state) => {
      const convMessages = state.messages[conversationId] || [];
      const updated = convMessages.map((m) => (m.id === messageId ? { ...m, reactions } : m));
      return { messages: { ...state.messages, [conversationId]: updated } };
    });
  },

  receiveReadReceipt: ({ conversationId, userId }) => {
    set((state) => {
      const convMessages = state.messages[conversationId] || [];
      const updated = convMessages.map((m) => {
        const readBy = m.readBy || [];
        if (!readBy.includes(userId)) {
          return { ...m, readBy: [...readBy, userId] };
        }
        return m;
      });
      return { messages: { ...state.messages, [conversationId]: updated } };
    });
  },

  setUserPresence: (userId: string, isOnline: boolean) => {
    set((state) => {
      const currentList = state.onlineUserIds;
      const updatedList = isOnline
        ? Array.from(new Set([...currentList, userId]))
        : currentList.filter((id) => id !== userId);

      const updatedConversations = state.conversations.map((c) => {
        if (c.type === 'DIRECT') {
          const otherMember = c.members?.find((m: any) => (m._id?.toString() || m.toString()) === userId);
          if (otherMember) {
            return { ...c, isOnline };
          }
        }
        return c;
      });

      return { onlineUserIds: updatedList, conversations: updatedConversations };
    });
  },

  setTyping: (conversationId: string, username: string | null) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [conversationId]: username },
    }));
  },

  sendTyping: (conversationId: string, isTyping: boolean) => {
    const socket = getSocket();
    if (isTyping) {
      socket.emit('typing:start', { conversationId });
    } else {
      socket.emit('typing:stop', { conversationId });
    }
  },

  clearChatState: () => {
    set({
      conversations: [],
      activeConversationId: null,
      messages: {},
      messagePagination: {},
      typingUsers: {},
      replyingTo: null,
      forwardingMessage: null,
    });
  },
}));
