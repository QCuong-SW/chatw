import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface ConversationItemProps {
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread?: number;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({
  name,
  avatar,
  lastMessage,
  timestamp,
  unread,
  isActive,
  onClick,
}: ConversationItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-gray-100 ${
        isActive ? 'bg-blue-50 hover:bg-blue-50' : ''
      }`}
    >
      <Avatar className="w-12 h-12">
        <AvatarImage src={avatar} />
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1">
          <span className={`${unread ? 'font-semibold' : ''}`}>{name}</span>
          <span className="text-xs text-gray-500">{timestamp}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className={`text-sm truncate ${unread ? 'font-medium' : 'text-gray-600'}`}>
            {lastMessage}
          </p>
          {unread && unread > 0 && (
            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
              {unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
