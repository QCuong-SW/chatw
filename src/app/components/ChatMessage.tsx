import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface ChatMessageProps {
  message: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string;
  senderAvatar?: string;
}

export function ChatMessage({ message, timestamp, isSent, senderName, senderAvatar }: ChatMessageProps) {
  return (
    <div className={`flex gap-3 mb-4 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isSent && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback>{senderName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
      )}
      <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isSent && senderName && (
          <span className="text-xs text-gray-500 mb-1 px-1">{senderName}</span>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isSent
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-gray-200 text-gray-900 rounded-bl-sm'
          }`}
        >
          <p className="break-words">{message}</p>
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1">{timestamp}</span>
      </div>
    </div>
  );
}
