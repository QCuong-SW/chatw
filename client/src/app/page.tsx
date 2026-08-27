'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AntigravityParticleCanvas } from '@/components/ui/AntigravityParticleCanvas';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ConversationItem } from '@/components/chat/ConversationItem';
import { CallModal } from '@/components/call/CallModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  LogOut,
  User as UserIcon,
  MessageSquare,
  Plus,
  Image as ImageIcon,
  Smile,
  X,
  Mic,
  Square,
  Sun,
  Moon,
  ArrowUpCircle,
  Check,
  Camera,
  Loader2,
  Pin,
  ShieldAlert,
  BellOff,
  Forward,
  Users,
  UserPlus,
  Info,
  Paperclip,
  FolderOpen,
  FileText,
  UserCheck,
  Clock,
  UserX,
  Sparkles,
  Mail,
  Inbox,
  Trash2,
  Crown,
  Compass,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { useCallStore } from '@/stores/call.store';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

const EMOJIS = ['😀', '😂', '😍', '🔥', '👍', '🎉', '😎', '❤️', '🙌', '🚀', '💯', '✨', '🥺', '👀', '🥳', '👏'];

export default function ChatPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading, fetchMe, logout } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    messagePagination,
    typingUsers,
    replyingTo,
    forwardingMessage,
    setReplyingTo,
    setForwardingMessage,
    forwardMessageTo,
    fetchConversations,
    selectConversation,
    loadMoreMessages,
    createDirectConversation,
    createGroupConversation,
    addGroupMembers,
    renameGroup,
    leaveGroup,
    deleteConversationForMe,
    deleteGroupPermanently,
    sendMessage,
    unpinMessage,
    blockUser,
    receiveSocketMessage,
    receiveUnsentMessage,
    receivePinnedMessage,
    receiveUnpinnedMessage,
    receiveReaction,
    receiveReadReceipt,
    setUserPresence,
    setTyping,
    sendTyping,
    clearChatState,
  } = useChatStore();

  const { initiateCall } = useCallStore();

  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  
  // Friends & Search states
  const [myFriends, setMyFriends] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('search');
  
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'settings'>('profile');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(330);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isConversationsExpanded, setIsConversationsExpanded] = useState(true);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000, active: false });

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Group creation state (ONLY FRIENDS)
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([]);
  const [newGroupMemberIds, setNewGroupMemberIds] = useState<string[]>([]);

  // Profile edit state
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Dynamic height for Find Friends modal tabs
  const [modalHeight, setModalHeight] = useState<number | undefined>(undefined);
  const searchTabRef = useRef<HTMLDivElement>(null);
  const requestsTabRef = useRef<HTMLDivElement>(null);
  const groupTabRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sidebar Mouse Drag-to-Resize & Collapse Physics
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSidebar) return;
      // 64px is the width of the mini nav rail
      const newWidth = e.clientX - 64;
      if (newWidth < 140) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
        setSidebarWidth(Math.min(540, Math.max(240, newWidth)));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingSidebar) {
        setIsDraggingSidebar(false);
      }
    };

    if (isDraggingSidebar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSidebar]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isNewChatOpen) return;
    const updateHeight = () => {
      if (activeTab === 'search' && searchTabRef.current) {
        setModalHeight(searchTabRef.current.offsetHeight);
      } else if (activeTab === 'requests' && requestsTabRef.current) {
        setModalHeight(requestsTabRef.current.offsetHeight);
      } else if (activeTab === 'group' && groupTabRef.current) {
        setModalHeight(groupTabRef.current.offsetHeight);
      }
    };
    const timer = setTimeout(updateHeight, 30);
    return () => clearTimeout(timer);
  }, [activeTab, isNewChatOpen, searchResults, friendRequests, myFriends, hasSearched, isSearching, selectedGroupMemberIds]);

  // 1. Initial Auth Check
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // 2. Strict Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user && !accessToken) {
      clearChatState();
      router.push('/login');
    } else if (user) {
      fetchConversations();
      fetchFriendRequests();
      fetchFriendsList();
    }
  }, [isAuthLoading, user, accessToken, router, fetchConversations, clearChatState]);

  useEffect(() => {
    if (user) {
      setProfileDisplayName(user.displayName);
      setProfileBio(user.bio || '');
      setProfilePhone((user as any).phoneNumber || '');
    }
  }, [user]);

  const fetchFriendRequests = async () => {
    try {
      const { data } = await api.get('/users/friend-requests');
      setFriendRequests(data);
    } catch {}
  };

  const fetchFriendsList = async () => {
    setLoadingFriends(true);
    try {
      const { data } = await api.get('/users/friends');
      setMyFriends(data);
    } catch {
      setMyFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    const socket = getSocket();

    const handleSyncAll = () => {
      fetchConversations();
      fetchFriendsList();
      fetchFriendRequests();
    };

    socket.on('message:new', (msg) => {
      receiveSocketMessage(msg);
      fetchConversations();
    });

    socket.on('message:unsent', (data) => {
      receiveUnsentMessage(data);
      fetchConversations();
    });

    socket.on('message:pinned', (data) => {
      receivePinnedMessage(data);
    });

    socket.on('message:unpinned', (data) => {
      receiveUnpinnedMessage(data);
    });

    socket.on('message:reacted', (data) => {
      receiveReaction(data);
    });

    socket.on('message:read_receipt', (data) => {
      receiveReadReceipt(data);
    });

    socket.on('conversation:created', () => {
      handleSyncAll();
    });

    socket.on('conversation:updated', () => {
      fetchConversations();
    });

    socket.on('conversation:deleted', ({ conversationId }) => {
      fetchConversations();
      if (activeConversationId === conversationId) {
        selectConversation(null);
      }
    });

    socket.on('friend:request', () => {
      fetchFriendRequests();
    });

    socket.on('friend:accepted', () => {
      handleSyncAll();
    });

    socket.on('user:profile_updated', () => {
      handleSyncAll();
    });

    socket.on('connect', () => {
      handleSyncAll();
    });

    socket.on('user:online', ({ userId }) => {
      setUserPresence(userId, true);
    });

    socket.on('user:offline', ({ userId }) => {
      setUserPresence(userId, false);
    });

    socket.on('typing:start', ({ conversationId, username }) => {
      setTyping(conversationId, username);
    });

    socket.on('typing:stop', ({ conversationId }) => {
      setTyping(conversationId, null);
    });

    return () => {
      socket.off('message:new');
      socket.off('message:unsent');
      socket.off('message:pinned');
      socket.off('message:unpinned');
      socket.off('message:reacted');
      socket.off('message:read_receipt');
      socket.off('conversation:created');
      socket.off('conversation:updated');
      socket.off('conversation:deleted');
      socket.off('friend:request');
      socket.off('friend:accepted');
      socket.off('user:profile_updated');
      socket.off('connect');
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [
    receiveSocketMessage,
    receiveUnsentMessage,
    receivePinnedMessage,
    receiveUnpinnedMessage,
    receiveReaction,
    receiveReadReceipt,
    setUserPresence,
    setTyping,
    fetchConversations,
    activeConversationId,
    selectConversation,
  ]);

  // Continuous Background Database Sync Heartbeat (Every 8 seconds)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchConversations();
      fetchFriendRequests();
    }, 8000);
    return () => clearInterval(interval);
  }, [user, fetchConversations]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const rawMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const currentPagination = activeConversationId ? messagePagination[activeConversationId] : null;

  const filteredMessages = chatSearchQuery.trim()
    ? rawMessages.filter((m) => m.content.toLowerCase().includes(chatSearchQuery.toLowerCase()))
    : rawMessages;

  const currentTypingUser = activeConversationId ? typingUsers[activeConversationId] : null;
  const mediaGallery = rawMessages.filter((m) => m.attachments && m.attachments.length > 0 && !m.isDeleted);

  const isGroupCreator = activeConversation?.type === 'GROUP' && (activeConversation?.creatorId === user?.id || (activeConversation?.members?.[0] && activeConversation?.members?.[0]._id === user?.id));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rawMessages.length, currentTypingUser]);

  // Privacy Search: ONLY search when user enters query (no default listing)
  const handleSearchUsers = (text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!text.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(text.trim())}`);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      await api.post(`/users/friend-request/${targetUserId}`);
      setSearchResults((prev) =>
        prev.map((u) => (u._id === targetUserId ? { ...u, hasReceivedRequest: true } : u))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error sending friend request');
    }
  };

  const handleAcceptFriendRequest = async (fromUserId: string) => {
    try {
      const { data } = await api.post(`/users/friend-request/${fromUserId}/accept`);
      await fetchFriendRequests();
      await fetchFriendsList();
      await fetchConversations();
      if (data.conversationId) {
        setIsNewChatOpen(false);
        selectConversation(data.conversationId);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error accepting friend request');
    }
  };

  const handleRejectFriendRequest = async (fromUserId: string) => {
    try {
      await api.delete(`/users/friend-request/${fromUserId}`);
      await fetchFriendRequests();
    } catch {}
  };

  // Loading Screen while authenticating
  if (isAuthLoading || (!user && !accessToken)) {
    return (
      <div className="relative flex h-screen w-screen bg-slate-950 items-center justify-center overflow-hidden select-none">
        <div className="absolute w-96 h-96 bg-blue-600/15 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
        <div className="absolute w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-1000" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-3xl blur-md opacity-70 group-hover:opacity-100 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex flex-col items-center justify-center shadow-2xl border border-blue-400/30">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <MessageSquare className="w-9 h-9 text-white drop-shadow-md" />
                <div className="absolute top-[13px] left-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center text-center space-y-2">
            <h1 className="text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-blue-200 drop-shadow-sm">
              ChatApp <span className="text-blue-400 text-lg font-normal">Realtime</span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Đang xác thực bảo mật & tải tin nhắn...
            </p>
          </div>

          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden relative">
            <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-[shimmer_1.5s_infinite] shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!messageInput.trim() && !selectedImageFile && !selectedImagePreview) return;

    let attachments: any[] = [];

    if (selectedImageFile) {
      setIsUploadingMedia(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedImageFile);
        const { data } = await api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        attachments = [{ url: data.url, type: 'IMAGE', name: selectedImageFile.name, size: data.bytes }];
      } catch (err) {
        attachments = [{ url: selectedImagePreview, type: 'IMAGE', name: 'photo.jpg' }];
      } finally {
        setIsUploadingMedia(false);
      }
    }

    sendMessage(messageInput, attachments.length > 0 ? 'IMAGE' : 'TEXT', attachments);

    if (activeConversationId) {
      sendTyping(activeConversationId, false);
    }
    setMessageInput('');
    setSelectedImageFile(null);
    setSelectedImagePreview(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (activeConversationId) {
      sendTyping(activeConversationId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(activeConversationId, false);
      }, 2000);
    }
  };

  // Voice Message Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        try {
          const audioFile = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('file', audioFile);
          const { data } = await api.post('/uploads', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          sendMessage('', 'AUDIO', [{ url: data.url, type: 'AUDIO', name: 'voice_message.webm' }]);
        } catch {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            sendMessage('', 'AUDIO', [{ url: base64Audio, type: 'AUDIO', name: 'voice_message.webm' }]);
          };
          reader.readAsDataURL(audioBlob);
        }
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Error recording audio:', err);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeConversationId) {
      setIsUploadingMedia(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        sendMessage(file.name, 'FILE', [{ url: data.url, type: 'FILE', name: file.name, size: data.bytes }]);
      } catch (err) {
        console.error('Document upload error:', err);
      } finally {
        setIsUploadingMedia(false);
      }
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAvatar(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/uploads/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        await api.patch('/users/me', { avatar: data.url });
        await fetchMe();
      } catch (err) {
        console.error('Failed to upload avatar to Cloudinary:', err);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const openNewChatDialog = async () => {
    setIsNewChatOpen(true);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    await fetchFriendRequests();
    await fetchFriendsList();
  };

  const openAddMemberDialog = async () => {
    setIsAddMemberOpen(true);
    await fetchFriendsList();
  };

  const handleAddMembersToGroup = async () => {
    if (!activeConversationId || newGroupMemberIds.length === 0) return;
    try {
      await addGroupMembers(activeConversationId, newGroupMemberIds);
      setIsAddMemberOpen(false);
      setNewGroupMemberIds([]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding members');
    }
  };

  const startDirectChat = async (recipientId: string) => {
    setIsNewChatOpen(false);
    try {
      const convId = await createDirectConversation(recipientId);
      selectConversation(convId);
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupTitle.trim() || selectedGroupMemberIds.length === 0) return;
    try {
      await createGroupConversation(groupTitle, selectedGroupMemberIds);
      setIsNewChatOpen(false);
      setGroupTitle('');
      setSelectedGroupMemberIds([]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating group');
    }
  };

  const toggleGroupMember = (id: string) => {
    if (selectedGroupMemberIds.includes(id)) {
      setSelectedGroupMemberIds(selectedGroupMemberIds.filter((m) => m !== id));
    } else {
      setSelectedGroupMemberIds([...selectedGroupMemberIds, id]);
    }
  };

  const toggleNewMember = (id: string) => {
    if (newGroupMemberIds.includes(id)) {
      setNewGroupMemberIds(newGroupMemberIds.filter((m) => m !== id));
    } else {
      setNewGroupMemberIds([...newGroupMemberIds, id]);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await api.patch('/users/me', {
        displayName: profileDisplayName,
        bio: profileBio,
        phoneNumber: profilePhone,
      });
      await fetchMe();
      setIsProfileOpen(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleBlockCurrentMember = async () => {
    if (!activeConversation) return;
    const otherMember = activeConversation.members?.find((m: any) => m._id !== user?.id);
    if (otherMember) {
      await blockUser(otherMember._id);
      setIsMoreMenuOpen(false);
    }
  };

  const handleDeleteForMe = async () => {
    if (!activeConversationId) return;
    if (confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này ở phía bạn không?')) {
      await deleteConversationForMe(activeConversationId);
      setIsMoreMenuOpen(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!activeConversationId) return;
    if (confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa nhóm này vĩnh viễn không?')) {
      try {
        await deleteGroupPermanently(activeConversationId);
        setIsMoreMenuOpen(false);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Error deleting group');
      }
    }
  };

  const handleLogout = async () => {
    clearChatState();
    await logout();
    router.push('/login');
  };

  const handleStartCall = (isVideo: boolean) => {
    if (!activeConversation) return;
    const currentUserId = user?.id;
    const otherMember = activeConversation.members?.find((m: any) => m._id !== currentUserId);
    const recipientId = otherMember?._id || 'other-user';

    initiateCall(recipientId, activeConversation.name, activeConversation.id, isVideo);
  };

  const existingConvMemberIds = activeConversation?.members?.map((m: any) => m._id) || [];
  const eligibleFriendsToAdd = myFriends.filter((f: any) => !existingConvMemberIds.includes(f._id));

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* WebRTC Video/Voice Call Modal */}
      <CallModal />

      {/* Mini App Nav Rail */}
      <div className="w-16 bg-slate-900 text-white flex flex-col items-center py-5 justify-between select-none">
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-300 transform active:scale-90 cursor-pointer group"
            title={isSidebarOpen ? 'Thu gọn danh sách chat' : 'Mở danh sách chat'}
          >
            <MessageSquare className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-all duration-300 transform active:scale-90 cursor-pointer overflow-hidden group"
            title="Toggle Dark Mode"
          >
            <div className="transition-transform duration-500 transform group-hover:rotate-45">
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-400 transition-all duration-500" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-300 transition-all duration-500" />
              )}
            </div>
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div
            onClick={() => {
              setProfileModalTab('profile');
              setIsProfileOpen(true);
            }}
            className="relative group cursor-pointer"
            title="Tài khoản & Cài đặt"
          >
            <Avatar className="w-10 h-10 ring-2 ring-slate-700 hover:ring-blue-500 transition-all duration-200 shadow-md">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-slate-800 text-white font-bold">{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Forward Message Dialog */}
      <Dialog open={!!forwardingMessage} onOpenChange={(open) => !open && setForwardingMessage(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Forward Message</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs italic text-slate-700 dark:text-slate-300 truncate">
              {forwardingMessage?.content || 'Media/Voice attachment'}
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Target Conversation:</p>
            <ScrollArea className="h-60">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => forwardMessageTo(conv.id)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition mb-1"
                >
                  <div className="flex items-center gap-3 truncate">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={conv.avatar} />
                      <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{conv.name}</span>
                  </div>
                  <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    Send
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Members to Group Dialog (ONLY FRIENDS) */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Thêm Bạn Bè Vào Nhóm</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <ScrollArea className="h-56">
              {loadingFriends ? (
                <p className="text-center text-xs text-slate-400 py-6">Đang tải danh sách bạn bè...</p>
              ) : eligibleFriendsToAdd.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <UserX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Không có bạn bè nào chưa vào nhóm</p>
                  <p className="text-[11px] mt-1 text-slate-400">Chỉ có thể thêm người đã có trong danh sách Bạn bè.</p>
                </div>
              ) : (
                eligibleFriendsToAdd.map((u) => {
                  const isSelected = newGroupMemberIds.includes(u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() => toggleNewMember(u._id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition mb-1 ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={u.avatar} />
                          <AvatarFallback>{u.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{u.displayName}</p>
                          <p className="text-[11px] text-slate-400">@{u.username} {u.phoneNumber ? `• 📞 ${u.phoneNumber}` : ''}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                  );
                })
              )}
            </ScrollArea>
            <Button
              onClick={handleAddMembersToGroup}
              disabled={newGroupMemberIds.length === 0}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm"
            >
              Thêm ({newGroupMemberIds.length} bạn bè)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile & Settings Modal (2 Separate Tabs) */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {profileModalTab === 'profile' ? 'Hồ Sơ Cá Nhân' : 'Cài Đặt & Hệ Thống'}
            </DialogTitle>
          </DialogHeader>

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 -mx-6 px-6 pt-1 gap-6 text-sm font-semibold">
            <button
              onClick={() => setProfileModalTab('profile')}
              className={`pb-2.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                profileModalTab === 'profile'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <UserIcon className="w-4 h-4" /> Hồ sơ cá nhân
            </button>
            <button
              onClick={() => setProfileModalTab('settings')}
              className={`pb-2.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                profileModalTab === 'settings'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <SettingsIcon className="w-4 h-4" /> Cài đặt & Hệ thống
            </button>
          </div>

          {/* Tab 1: Profile */}
          {profileModalTab === 'profile' && (
            <div className="mt-4 space-y-4 animate-fade-in">
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <Avatar className="w-14 h-14 border border-slate-200 dark:border-slate-700">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-slate-800 text-white font-bold">{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    {isUploadingAvatar ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                  </div>
                  <input type="file" ref={avatarInputRef} onChange={handleAvatarSelect} accept="image/*" className="hidden" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{user?.displayName}</p>
                  <p className="text-xs text-slate-400">@{user?.username} • {user?.email}</p>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mt-0.5" onClick={() => avatarInputRef.current?.click()}>
                    Đổi ảnh đại diện (Cloudinary CDN)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Tên hiển thị (Display Name)
                </label>
                <Input
                  value={profileDisplayName}
                  onChange={(e) => setProfileDisplayName(e.target.value)}
                  className="rounded-xl h-10 text-sm dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Số điện thoại tìm bạn (Phone Number)
                </label>
                <Input
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="0901234567"
                  className="rounded-xl h-10 text-sm dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Tiểu sử (Bio)
                </label>
                <Input
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Xin chào! Mình đang dùng ChatApp."
                  className="rounded-xl h-10 text-sm dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setIsProfileOpen(false)} className="rounded-xl">
                  Hủy
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20"
                >
                  {isSavingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </Button>
              </div>
            </div>
          )}

          {/* Tab 2: Settings & Logout */}
          {profileModalTab === 'settings' && (
            <div className="mt-4 space-y-4 animate-fade-in">
              {/* Theme toggle setting */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Giao diện (Theme Mode)</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{isDarkMode ? 'Đang bật Chế độ Tối (Dark Mode)' : 'Đang bật Chế độ Sáng (Light Mode)'}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {isDarkMode ? 'Chuyển sang Sáng' : 'Chuyển sang Tối'}
                </Button>
              </div>

              {/* Account Security Info */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                <p className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">Thông Tin Tài Khoản</p>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Email đăng ký:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{user?.email}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Tên người dùng:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">@{user?.username}</span>
                </div>
              </div>

              {/* Logout Action Button (Inside Settings) */}
              <div className="pt-2">
                <Button
                  onClick={handleLogout}
                  className="w-full h-11 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-400 border border-red-200 dark:border-red-800/80 rounded-xl font-bold gap-2 cursor-pointer transition shadow-xs"
                >
                  <LogOut className="w-4 h-4" /> Đăng Xuất Khỏi Tài Khoản
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sidebar - Conversations (Silky Smooth Sliding Drawer & Drag Resizable) */}
      <div
        style={{
          width: `${sidebarWidth}px`,
          marginLeft: isSidebarOpen ? '0px' : `-${sidebarWidth}px`,
          transition: isDraggingSidebar ? 'none' : 'margin-left 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shadow-md z-20 ${
          isDraggingSidebar ? 'select-none' : 'sidebar-transition'
        } ${!isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        {/* Draggable Border Handle for Mouse Resizing */}
        {isSidebarOpen && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingSidebar(true);
            }}
            onDoubleClick={() => setSidebarWidth(330)}
            className={`absolute top-0 right-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/80 active:bg-blue-600 transition-all duration-200 z-30 group flex items-center justify-center ${
              isDraggingSidebar ? 'bg-blue-600' : ''
            }`}
            title="Kéo sang trái / phải để điều chỉnh độ rộng, nhấp đúp để đặt lại mặc định"
          >
            <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 rounded-full group-hover:bg-white group-hover:h-14 transition-all" />
          </div>
        )}

        <div style={{ width: `${sidebarWidth}px` }} className="flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Messages</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Thu gọn danh sách"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </Button>
              </div>
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openNewChatDialog}
                  className="rounded-xl h-8 px-2.5 text-xs gap-1 border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tìm bạn & Nhóm
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border dark:border-slate-800">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Tìm Bạn Bè & Tạo Nhóm</DialogTitle>
                </DialogHeader>

                {/* Smooth Sliding Mode Tab Switcher with Spring Animation & React Icons */}
                <div className="relative grid grid-cols-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4 mt-3 select-none">
                  {/* Spring Sliding Pill */}
                  <div
                    className="absolute top-1.5 bottom-1.5 w-[calc(33.333%-4px)] bg-white dark:bg-slate-900 rounded-xl shadow-md transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{
                      left: activeTab === 'search' ? '4px' : activeTab === 'requests' ? 'calc(33.333% + 2px)' : 'calc(66.666% + 0px)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setActiveTab('search')}
                    className={`relative z-10 py-2.5 text-xs font-bold text-center rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                      activeTab === 'search' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Search className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'search' ? 'scale-110 text-blue-600 dark:text-blue-400' : ''}`} />
                    <span>Tìm Bạn Mới</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('requests')}
                    className={`relative z-10 py-2.5 text-xs font-bold text-center rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                      activeTab === 'requests' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Mail className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'requests' ? 'scale-110 text-blue-600 dark:text-blue-400' : ''}`} />
                    <span>Lời Mời</span>
                    {friendRequests.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-bold animate-pulse">
                        {friendRequests.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('group')}
                    className={`relative z-10 py-2.5 text-xs font-bold text-center rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                      activeTab === 'group' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Users className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'group' ? 'scale-110 text-blue-600 dark:text-blue-400' : ''}`} />
                    <span>Tạo Nhóm</span>
                  </button>
                </div>

                {/* Dynamic Height Morphing & 3-Panel Horizontal Carousel Slider */}
                <div
                  className="relative overflow-hidden transition-[height] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ height: modalHeight ? `${modalHeight}px` : 'auto' }}
                >
                  <div
                    className={`flex w-[300%] transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      activeTab === 'search'
                        ? 'translate-x-0'
                        : activeTab === 'requests'
                        ? '-translate-x-1/3'
                        : '-translate-x-2/3'
                    }`}
                  >
                    {/* Panel 1: Privacy Search */}
                    <div
                      ref={searchTabRef}
                      className={`w-1/3 px-1 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        activeTab === 'search' ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-[1px] pointer-events-none'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input
                            placeholder="Nhập chính xác Số điện thoại, Email hoặc @username..."
                            value={searchQuery}
                            onChange={(e) => handleSearchUsers(e.target.value)}
                            className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                          />
                          {isSearching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4 animate-spin" />
                          )}
                        </div>

                        <ScrollArea className="h-64 mt-2 pr-2">
                          {!hasSearched ? (
                            <div className="text-center py-12 text-slate-400">
                              <Search className="w-10 h-10 mx-auto mb-2.5 text-slate-300 dark:text-slate-600 opacity-80" />
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tìm kiếm bảo mật</p>
                              <p className="text-[11px] mt-1 text-slate-400 max-w-xs mx-auto">
                                Nhập chính xác Số điện thoại, Email hoặc Username để tìm và kết nối với người dùng.
                              </p>
                            </div>
                          ) : isSearching ? (
                            <p className="text-center text-xs text-slate-400 py-10">Đang tìm kiếm...</p>
                          ) : searchResults.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                              <UserX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Không tìm thấy tài khoản phù hợp</p>
                              <p className="text-[11px] mt-1 text-slate-400">Vui lòng kiểm tra lại Số điện thoại, Email hoặc @username.</p>
                            </div>
                          ) : (
                            searchResults.map((u) => (
                              <div
                                key={u._id}
                                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition mb-1 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                                  <Avatar className="w-10 h-10 border border-slate-200 dark:border-slate-700 shrink-0">
                                    <AvatarImage src={u.avatar} />
                                    <AvatarFallback>{u.displayName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{u.displayName}</p>
                                    <p className="text-[11px] text-slate-400 truncate">
                                      @{u.username} {u.phoneNumber ? `• 📞 ${u.phoneNumber}` : ''} • {u.email}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Button
                                    size="sm"
                                    onClick={() => startDirectChat(u._id)}
                                    className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1 cursor-pointer"
                                  >
                                    <MessageSquare className="w-3 h-3" /> Chat
                                  </Button>

                                  {u.isFriend ? (
                                    <span className="text-[11px] text-emerald-600 font-semibold px-2 flex items-center gap-1">
                                      <UserCheck className="w-3.5 h-3.5" /> Bạn bè
                                    </span>
                                  ) : u.hasReceivedRequest ? (
                                    <Button size="sm" variant="outline" disabled className="h-7 px-2 text-[11px] rounded-lg opacity-70 gap-1">
                                      <Clock className="w-3 h-3 text-amber-500" /> Đã gửi
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSendFriendRequest(u._id)}
                                      className="h-7 px-2 text-[11px] rounded-lg border-blue-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 gap-1 cursor-pointer"
                                    >
                                      <UserPlus className="w-3 h-3" /> Kết bạn
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </ScrollArea>
                      </div>
                    </div>

                    {/* Panel 2: Lời mời kết bạn */}
                    <div
                      ref={requestsTabRef}
                      className={`w-1/3 px-1 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        activeTab === 'requests' ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-[1px] pointer-events-none'
                      }`}
                    >
                      <ScrollArea className="h-72 pr-2">
                        {friendRequests.length === 0 ? (
                          <div className="text-center py-14 text-slate-400 text-xs">
                            <Mail className="w-9 h-9 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                            <p className="font-semibold text-slate-600 dark:text-slate-300">Chưa có lời mời nào</p>
                            <p className="text-[11px] mt-1 text-slate-400">Các lời mời kết bạn mới sẽ hiển thị tại đây.</p>
                          </div>
                        ) : (
                          friendRequests.map((req) => (
                            <div
                              key={req._id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 mb-2 border border-slate-100 dark:border-slate-700"
                            >
                              <div className="flex items-center gap-2.5">
                                <Avatar className="w-9 h-9">
                                  <AvatarImage src={req.avatar} />
                                  <AvatarFallback>{req.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{req.displayName}</p>
                                  <p className="text-[11px] text-slate-400">@{req.username} • {req.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptFriendRequest(req._id)}
                                  className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                                >
                                  Chấp nhận
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRejectFriendRequest(req._id)}
                                  className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer"
                                >
                                  Từ chối
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </ScrollArea>
                    </div>

                    {/* Panel 3: Tạo nhóm chat */}
                    <div
                      ref={groupTabRef}
                      className={`w-1/3 px-1 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        activeTab === 'group' ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-[1px] pointer-events-none'
                      }`}
                    >
                      <div className="space-y-3">
                        <Input
                          placeholder="Tên nhóm (ví dụ: Team Dự Án / Hội Bạn Thân)"
                          value={groupTitle}
                          onChange={(e) => setGroupTitle(e.target.value)}
                          className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                        />

                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Chọn từ danh sách bạn bè ({myFriends.length}):
                          </p>
                        </div>

                        <ScrollArea className="h-44 pr-2">
                          {loadingFriends ? (
                            <p className="text-center text-xs text-slate-400 py-6">Đang tải bạn bè...</p>
                          ) : myFriends.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                              <UserX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Chưa có bạn bè để tạo nhóm</p>
                              <p className="text-[11px] mt-1 text-slate-400">Chỉ những người đã kết bạn mới có thể thêm vào nhóm.</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActiveTab('search')}
                                className="mt-3 text-xs h-7 text-blue-600 border-blue-200 dark:border-slate-700 cursor-pointer"
                              >
                                Tìm & Kết bạn ngay
                              </Button>
                            </div>
                          ) : (
                            myFriends.map((u) => {
                              const isSelected = selectedGroupMemberIds.includes(u._id);
                              return (
                                <div
                                  key={u._id}
                                  onClick={() => toggleGroupMember(u._id)}
                                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition mb-1 ${
                                    isSelected ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage src={u.avatar} />
                                      <AvatarFallback>{u.displayName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{u.displayName}</p>
                                      <p className="text-[10px] text-slate-400">@{u.username} {u.phoneNumber ? `• 📞 ${u.phoneNumber}` : ''}</p>
                                    </div>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                </div>
                              );
                            })
                          )}
                        </ScrollArea>

                        <Button
                          onClick={handleCreateGroup}
                          disabled={!groupTitle.trim() || selectedGroupMemberIds.length === 0 || myFriends.length === 0}
                          className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm cursor-pointer disabled:opacity-50"
                        >
                          Tạo nhóm ({selectedGroupMemberIds.length} bạn bè)
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              className="pl-9 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-300 rounded-xl text-sm focus-visible:ring-blue-500"
            />
          </div>
        </div>

        {/* Collapsible Recent Chats Sub-Section */}
        <div
          onClick={() => setIsConversationsExpanded(!isConversationsExpanded)}
          className="flex items-center justify-between px-4 py-2 mt-1 cursor-pointer select-none text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Đã chat gần đây
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {conversations.length}
            </span>
          </div>
          <div
            className={`p-1 rounded-md text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform duration-300 transform ${
              isConversationsExpanded ? 'rotate-0' : '-rotate-90'
            }`}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        <ScrollArea className="flex-1 py-1">
          {/* Animated Accordion Container */}
          <div
            style={{
              transition: 'grid-template-rows 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className={`grid accordion-content-transition ${
              isConversationsExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  Chưa có cuộc trò chuyện nào. Bấm "+ Tìm bạn & Nhóm" để bắt đầu!
                </div>
              ) : (
                conversations.map((conversation, idx) => (
                  <div
                    key={conversation.id}
                    style={{ animationDelay: `${idx * 40}ms` }}
                    className="animate-item-enter"
                  >
                    <ConversationItem
                      name={conversation.name}
                      avatar={conversation.avatar}
                      lastMessage={conversation.lastMessage || ''}
                      timestamp={conversation.timestamp || ''}
                      unread={conversation.unread}
                      isActive={conversation.id === activeConversationId}
                      isOnline={conversation.isOnline}
                      onClick={() => selectConversation(conversation.id)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area with Soothing Pastel Blue Background */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-[#eef6ff] via-[#e6f1fc] to-[#edf5ff] dark:bg-gradient-to-b dark:from-[#0b1329] dark:via-[#090e1f] dark:to-[#070b18] relative overflow-hidden">
        {activeConversation ? (
          <div key={activeConversation.id} className="flex-1 flex flex-col h-full animate-chat-open overflow-hidden">
            {/* Header */}
            <div className="h-16 px-4 md:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-blue-100/80 dark:border-slate-800/80 flex items-center justify-between shadow-xs z-10">
              <div className="flex items-center gap-3">
                {!isSidebarOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(true)}
                    className="h-9 w-9 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 mr-1 cursor-pointer"
                    title="Mở danh sách hội thoại"
                  >
                    <PanelLeftOpen className="w-5 h-5" />
                  </Button>
                )}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsInfoDrawerOpen(!isInfoDrawerOpen)}>
                <Avatar className="w-10 h-10 border border-slate-200 dark:border-slate-700">
                  <AvatarImage src={activeConversation.avatar} />
                  <AvatarFallback>{activeConversation.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                    {activeConversation.name}
                  </h2>
                  {activeConversation.type === 'GROUP' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {activeConversation.members?.length || 0} thành viên
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
                {/* Message Search Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatSearchOpen(!isChatSearchOpen)}
                  className={`text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl ${
                    isChatSearchOpen ? 'bg-blue-50 dark:bg-blue-950 text-blue-600' : ''
                  }`}
                  title="Search Messages"
                >
                  <Search className="w-4 h-4" />
                </Button>

                <Button
                  onClick={() => handleStartCall(false)}
                  variant="ghost"
                  size="icon"
                  className="text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  title="Voice Call"
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleStartCall(true)}
                  variant="ghost"
                  size="icon"
                  className="text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                </Button>

                {/* Conversation Info / Gallery Drawer Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsInfoDrawerOpen(!isInfoDrawerOpen)}
                  className={`text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 transform active:scale-90 cursor-pointer ${
                    isInfoDrawerOpen ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : ''
                  }`}
                  title="Chat Info & Media Gallery"
                >
                  <Info className="w-4 h-4" />
                </Button>

                {/* More Menu Popover */}
                <Popover open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xl space-y-1">
                    {activeConversation.type === 'GROUP' && (
                      <button
                        onClick={() => { setIsMoreMenuOpen(false); openAddMemberDialog(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition text-left cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" /> Thêm bạn bè vào nhóm
                      </button>
                    )}
                    
                    <button
                      onClick={() => { setIsMoreMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-left cursor-pointer"
                    >
                      <BellOff className="w-4 h-4 text-slate-400" /> Tắt thông báo
                    </button>

                    {/* Delete for me (Xóa phía tôi) */}
                    <button
                      onClick={handleDeleteForMe}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-left cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" /> Xóa đoạn chat phía tôi
                    </button>

                    {activeConversation.type === 'GROUP' ? (
                      <>
                        <button
                          onClick={handleDeleteGroup}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition text-left cursor-pointer font-semibold"
                        >
                          <Trash2 className="w-4 h-4" /> Xóa nhóm chat này
                        </button>
                        <button
                          onClick={() => leaveGroup(activeConversation.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" /> Rời nhóm
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleBlockCurrentMember}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition text-left cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4" /> Chặn người dùng
                      </button>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Pinned Message Banner */}
            {activeConversation.pinnedMessage && (
              <div className="px-6 py-2.5 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between animate-fade-in shadow-2xs z-10">
                <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200 truncate flex-1 mr-2">
                  <Pin className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold shrink-0">Tin nhắn đã ghim:</span>
                  <span className="truncate italic text-slate-700 dark:text-slate-300">
                    {activeConversation.pinnedMessage.content || 'File đính kèm'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={unpinMessage}
                  className="h-7 px-2 text-[11px] text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg cursor-pointer"
                >
                  Bỏ ghim
                </Button>
              </div>
            )}

            {/* In-chat search bar */}
            {isChatSearchOpen && (
              <div className="px-6 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 animate-fade-in z-10">
                <Search className="w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Filter messages in this conversation..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="h-8 bg-white dark:bg-slate-800 text-xs rounded-lg border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setChatSearchQuery('');
                    setIsChatSearchOpen(false);
                  }}
                  className="h-8 px-2 text-xs text-slate-500"
                >
                  Close
                </Button>
              </div>
            )}

            <div className="flex-1 flex overflow-hidden">
              {/* Message History */}
              <ScrollArea className="flex-1 px-4 md:px-6 py-4">
                <div className="w-full">
                  {currentPagination?.hasMore && (
                    <div className="flex justify-center mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activeConversationId && loadMoreMessages(activeConversationId)}
                        className="rounded-full text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-slate-700 gap-1 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" /> Tải thêm tin nhắn cũ
                      </Button>
                    </div>
                  )}

                  {filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[360px] py-12 text-center select-none animate-fade-in">
                      <div className="relative mb-4">
                        <Avatar className="w-20 h-20 border-2 border-blue-500/20 shadow-xl">
                          <AvatarImage src={activeConversation?.avatar} />
                          <AvatarFallback className="text-2xl font-bold bg-blue-50 dark:bg-blue-950 text-blue-600">
                            {activeConversation?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                        {activeConversation?.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
                        Hãy bắt đầu cuộc trò chuyện với bạn bè của bạn! Gửi lời chào hoặc chọn nhanh một trong các gợi ý bên dưới.
                      </p>

                      {/* Quick starter icebreaker prompts */}
                      <div className="flex flex-wrap justify-center gap-2 max-w-md">
                        {[
                          '👋 Chào bạn! Rất vui được kết nối.',
                          '☕ Hôm nay của bạn thế nào rồi?',
                          '🚀 Có rảnh không, mình bàn việc xíu nhé!',
                          '✨ Xin chào!',
                        ].map((promptText) => (
                          <button
                            key={promptText}
                            onClick={() => setMessageInput(promptText)}
                            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 shadow-2xs hover:shadow-xs hover:scale-102 active:scale-98 transition-all cursor-pointer"
                          >
                            {promptText}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    filteredMessages.map((message) => (
                      <div key={message.id} className="animate-msg-pop">
                        <ChatMessage messageItem={message} />
                      </div>
                    ))
                  )}

                  {currentTypingUser && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic mb-3 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-bounce" />
                      {currentTypingUser} is typing...
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Info & Shared Media Drawer with Silky Smooth Sliding Animation (Open & Close) */}
              <div
                style={{
                  width: '320px',
                  marginRight: isInfoDrawerOpen ? '0px' : '-320px',
                  transition: 'margin-right 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isInfoDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
                }}
                className={`shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shadow-lg z-20 ${
                  isInfoDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div className="w-[320px] flex flex-col h-full p-4 shrink-0">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Chat Information</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      onClick={() => setIsInfoDrawerOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <ScrollArea className="flex-1 pt-3 space-y-4">
                    {/* Members List for Group */}
                    {activeConversation.type === 'GROUP' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Members ({activeConversation.members?.length || 0})
                          </p>
                          <Button size="sm" variant="ghost" onClick={openAddMemberDialog} className="h-6 px-1.5 text-[11px] text-blue-600 dark:text-blue-400 gap-1 cursor-pointer">
                            <Plus className="w-3 h-3" /> Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {activeConversation.members?.map((m: any) => {
                            const isThisMemberCreator = activeConversation.creatorId === m._id;
                            return (
                              <div key={m._id} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                                <Avatar className="w-7 h-7">
                                  <AvatarImage src={m.avatar} />
                                  <AvatarFallback>{m.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{m.displayName}</p>
                                    {isThisMemberCreator && (
                                      <span className="flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full text-[9px] font-bold shrink-0">
                                        <Crown className="w-2.5 h-2.5" /> Trưởng nhóm
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 truncate">{m.customStatus || 'Available'}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Shared Media Gallery */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5" /> Shared Media ({mediaGallery.length})
                      </p>
                      {mediaGallery.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">No shared files yet</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5">
                          {mediaGallery.map((m) =>
                            m.attachments?.map((att, i) => (
                              att.type === 'IMAGE' || att.url.startsWith('http') || att.url.startsWith('data:image') ? (
                                <img
                                  key={i}
                                  src={att.url}
                                  alt="media"
                                  className="h-20 w-full object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition"
                                />
                              ) : (
                                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-lg p-2 flex flex-col items-center justify-center text-[10px] text-center text-slate-600 dark:text-slate-300 truncate">
                                  <FileText className="w-6 h-6 text-blue-500 mb-1" />
                                  <span className="truncate w-full">{att.name}</span>
                                </div>
                              )
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Dangerous Actions (Delete Group / Leave / Clear) */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hành Động</p>
                      {activeConversation.type === 'GROUP' ? (
                        <>
                          <button
                            onClick={handleDeleteGroup}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" /> Xóa nhóm chat này
                          </button>
                          <button
                            onClick={() => { setIsInfoDrawerOpen(false); leaveGroup(activeConversation.id); }}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" /> Rời nhóm chat
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleDeleteForMe}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" /> Xóa đoạn chat phía tôi
                        </button>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>

            {/* Reply bar preview */}
            {replyingTo && (
              <div className="px-6 py-2 bg-blue-50 dark:bg-blue-950/40 border-t border-blue-200 dark:border-blue-900 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-blue-900 dark:text-blue-300 truncate">
                  <span className="font-bold">Replying to {replyingTo.senderName}:</span>
                  <span className="truncate italic text-slate-600 dark:text-slate-400">{replyingTo.content}</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setReplyingTo(null)}
                  className="h-6 w-6 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {/* Preview Selected Image */}
            {selectedImagePreview && (
              <div className="px-6 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <img src={selectedImagePreview} alt="Selected" className="h-16 w-16 object-cover rounded-xl border border-slate-300 dark:border-slate-700" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Cloudinary CDN will process this file</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedImageFile(null);
                      setSelectedImagePreview(null);
                    }}
                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 md:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-blue-100/80 dark:border-slate-800/80 shadow-xs">
              <div className="w-full flex items-center gap-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                <input
                  type="file"
                  ref={docInputRef}
                  onChange={handleDocSelect}
                  accept=".pdf,.doc,.docx,.zip,.txt,.xlsx,.pptx"
                  className="hidden"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-slate-600 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="Attach Photo (Cloudinary CDN)"
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => docInputRef.current?.click()}
                  className="text-slate-600 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="Attach Document / File"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={`rounded-xl transition cursor-pointer ${
                    isRecording
                      ? 'bg-red-500/20 text-red-500 animate-pulse hover:bg-red-500/30'
                      : 'text-slate-600 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
                  }`}
                  title={isRecording ? 'Stop & Send Recording' : 'Record Voice Message'}
                >
                  {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-600 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                      title="Add Emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 grid grid-cols-4 gap-2">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setMessageInput((prev) => prev + emoji)}
                        className="text-xl hover:scale-125 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                <Input
                  placeholder={isRecording ? 'Đang ghi âm tin nhắn... bấm nút vuông để gửi' : 'Nhập tin nhắn...'}
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={isRecording || isUploadingMedia}
                  className="flex-1 bg-white dark:bg-slate-800 border border-blue-200/80 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-300 rounded-2xl py-6 px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-500 transition shadow-xs"
                />
                <Button
                  onClick={handleSend}
                  disabled={(!messageInput.trim() && !selectedImageFile && !selectedImagePreview) || isUploadingMedia}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-11 px-5 shadow-md shadow-blue-500/20 transition flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  {isUploadingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex-1 flex flex-col items-center justify-center p-8 overflow-hidden select-none">
            {!isSidebarOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-4 z-30 rounded-xl gap-1.5 shadow-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-md cursor-pointer border-slate-200 dark:border-slate-800 text-xs font-semibold"
                title="Mở danh sách hội thoại"
              >
                <PanelLeftOpen className="w-4 h-4 text-blue-600" /> Danh sách chat
              </Button>
            )}
            {/* Google Antigravity Full Interactive Canvas */}
            <AntigravityParticleCanvas />

            {/* Central Clean Typography Hero Content */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto py-8">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
                Trò chuyện & Gọi thoại bảo mật thế hệ mới
              </h1>

              <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-md">
                Nhắn tin tức thì, chia sẻ hình ảnh sắc nét và kết nối bạn bè với trải nghiệm mượt mà không giới hạn.
              </p>

              <div className="flex items-center gap-3">
                <Button
                  onClick={openNewChatDialog}
                  className="h-12 px-7 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/30 gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 transition duration-200"
                >
                  <UserPlus className="w-4 h-4" /> Tìm Bạn & Bắt Đầu Chat
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
