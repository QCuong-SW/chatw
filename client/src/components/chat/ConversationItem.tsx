import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ConversationItemProps {
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread?: number;
  isActive?: boolean;
  isOnline?: boolean;
  onClick: () => void;
}

export function ConversationItem({
  name,
  avatar,
  lastMessage,
  timestamp,
  unread,
  isActive,
  isOnline,
  onClick,
}: ConversationItemProps) {
  // Truncate message string after threshold characters to guarantee clean '...'
  const formattedMessage = React.useMemo(() => {
    if (!lastMessage) return '';
    const clean = lastMessage.trim();
    return clean.length > 25 ? clean.slice(0, 25) + '...' : clean;
  }, [lastMessage]);

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3.5 mx-2 my-1 rounded-2xl cursor-pointer transition-all duration-150 ${
        isActive
          ? 'bg-blue-100/90 dark:bg-blue-600/30 dark:border dark:border-blue-500/40 text-blue-950 dark:text-white shadow-xs'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
      }`}
    >
      <div className="relative shrink-0">
        <Avatar className="w-12 h-12 border border-slate-200 dark:border-slate-700">
          <AvatarImage src={avatar} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex justify-between items-baseline mb-1 gap-1">
          <h3 className={`text-sm font-bold truncate ${isActive ? 'text-blue-950 dark:text-white' : 'text-slate-900 dark:text-slate-100'}`}>
            {name}
          </h3>
          {timestamp && (
            <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal shrink-0 ml-1">
              {timestamp}
            </span>
          )}
        </div>
        <p className={`text-xs truncate block max-w-[190px] overflow-hidden text-ellipsis whitespace-nowrap ${isActive ? 'text-blue-800 dark:text-blue-200 font-medium' : 'text-slate-500 dark:text-slate-300'}`}>
          {formattedMessage}
        </p>
      </div>

      {unread && unread > 0 ? (
        <Badge className="bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ml-1">
          {unread}
        </Badge>
      ) : null}
    </div>
  );
}
