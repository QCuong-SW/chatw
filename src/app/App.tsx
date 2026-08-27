import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ConversationItem } from './components/ConversationItem';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { ScrollArea } from './components/ui/scroll-area';
import { Separator } from './components/ui/separator';
import { Send, Phone, Video, MoreVertical, Search } from 'lucide-react';

interface Message {
  id: string;
  message: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string;
  senderAvatar?: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread?: number;
  messages: Message[];
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    lastMessage: 'See you at the meeting!',
    timestamp: '2:30 PM',
    unread: 2,
    messages: [
      {
        id: '1',
        message: 'Hey! How are you doing?',
        timestamp: '2:15 PM',
        isSent: false,
        senderName: 'Sarah Johnson',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      },
      {
        id: '2',
        message: "I'm good! Thanks for asking. What about you?",
        timestamp: '2:20 PM',
        isSent: true,
      },
      {
        id: '3',
        message: 'Doing great! Are we still on for the meeting tomorrow?',
        timestamp: '2:25 PM',
        isSent: false,
        senderName: 'Sarah Johnson',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      },
      {
        id: '4',
        message: 'Yes, absolutely! 10 AM sharp.',
        timestamp: '2:28 PM',
        isSent: true,
      },
      {
        id: '5',
        message: 'See you at the meeting!',
        timestamp: '2:30 PM',
        isSent: false,
        senderName: 'Sarah Johnson',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      },
    ],
  },
  {
    id: '2',
    name: 'Mike Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    lastMessage: 'Thanks for the update!',
    timestamp: 'Yesterday',
    messages: [
      {
        id: '1',
        message: 'I sent you the project files',
        timestamp: 'Yesterday 4:30 PM',
        isSent: true,
      },
      {
        id: '2',
        message: 'Thanks for the update!',
        timestamp: 'Yesterday 4:35 PM',
        isSent: false,
        senderName: 'Mike Chen',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      },
    ],
  },
  {
    id: '3',
    name: 'Emily Davis',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    lastMessage: 'Perfect, talk to you soon!',
    timestamp: 'Friday',
    messages: [
      {
        id: '1',
        message: 'Can we reschedule our call?',
        timestamp: 'Friday 11:00 AM',
        isSent: false,
        senderName: 'Emily Davis',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      },
      {
        id: '2',
        message: 'Sure, how about next Monday?',
        timestamp: 'Friday 11:15 AM',
        isSent: true,
      },
      {
        id: '3',
        message: 'Perfect, talk to you soon!',
        timestamp: 'Friday 11:20 AM',
        isSent: false,
        senderName: 'Emily Davis',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      },
    ],
  },
  {
    id: '4',
    name: 'David Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    lastMessage: "Let's catch up later",
    timestamp: 'Thursday',
    unread: 1,
    messages: [
      {
        id: '1',
        message: 'Did you see the latest design mockups?',
        timestamp: 'Thursday 3:00 PM',
        isSent: false,
        senderName: 'David Wilson',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      },
      {
        id: '2',
        message: "Let's catch up later",
        timestamp: 'Thursday 3:05 PM',
        isSent: false,
        senderName: 'David Wilson',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      },
    ],
  },
];

export default function App() {
  const [conversations, setConversations] = useState(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState(conversations[0].id);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeConversation) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      message: messageInput,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isSent: true,
    };

    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === activeConversationId
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: messageInput,
              timestamp: 'Now',
            }
          : conv
      )
    );

    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              name={conversation.name}
              avatar={conversation.avatar}
              lastMessage={conversation.lastMessage}
              timestamp={conversation.timestamp}
              unread={conversation.unread}
              isActive={conversation.id === activeConversationId}
              onClick={() => setActiveConversationId(conversation.id)}
            />
          ))}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={activeConversation.avatar} />
                  <AvatarFallback>{activeConversation.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg">{activeConversation.name}</h2>
                  <p className="text-sm text-gray-500">Active now</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6">
              {activeConversation.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message.message}
                  timestamp={message.timestamp}
                  isSent={message.isSent}
                  senderName={message.senderName}
                  senderAvatar={message.senderAvatar}
                />
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2 items-end">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  size="icon"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
