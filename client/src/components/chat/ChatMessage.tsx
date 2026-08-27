import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Reply, Trash2, Pin, Forward, Check, CheckCheck, FileText, Download, SmilePlus } from 'lucide-react';
import { useChatStore, Message } from '@/stores/chat.store';
import { useAuthStore } from '@/stores/auth.store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '🔥', '😮', '😢', '🥰', '🎉', '👏', '💯', '🚀', '🙏'];
const ALL_REACTIONS = ['❤️', '👍', '😂', '🔥', '😮', '😢', '🥰', '🎉', '👏', '💯', '🚀', '🙏', '✨', '😍', '🤩', '😎', '🥳', '🤔', '💪', '👀', '💩', '🤝', '☕', '💡'];

interface ChatMessageProps {
  messageItem: Message;
}

export function ChatMessage({ messageItem }: ChatMessageProps) {
  const { senderName, senderAvatar, content, type, attachments = [], reactions = [], replyTo, timestamp, createdAt, isDeleted, isForwarded, readBy = [] } = messageItem;
  const isSent = !!(messageItem.isSent ?? messageItem.isMyMessage);
  const { reactToMessage, setReplyingTo, setForwardingMessage, unsendMessage, pinMessage } = useChatStore();
  const { user: currentUser } = useAuthStore();
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  
  const groupedReactions = useMemo(() => {
    if (!reactions || reactions.length === 0) return [];
    const map = new Map<string, { emoji: string; count: number; users: string[]; hasReacted: boolean }>();

    reactions.forEach((r: any) => {
      const emoji = r.emoji;
      const userObj = r.userId;
      const uId = typeof userObj === 'string' ? userObj : userObj?._id || userObj?.id;
      const uName = typeof userObj === 'object' ? userObj?.displayName || userObj?.username : '';
      const isMe = !!(currentUser && (currentUser.id === uId || (currentUser as any)._id === uId));

      if (!map.has(emoji)) {
        map.set(emoji, { emoji, count: 0, users: [], hasReacted: false });
      }
      const item = map.get(emoji)!;
      item.count += 1;
      if (isMe) {
        item.hasReacted = true;
        item.users.push('Bạn');
      } else if (uName) {
        item.users.push(uName);
      }
    });

    return Array.from(map.values());
  }, [reactions, currentUser]);

  const isRead = readBy.length > 1;

  if (isDeleted) {
    return (
      <div className={`flex gap-3 mb-3 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="rounded-2xl px-4 py-2 text-xs italic text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700">
          🚫 Tin nhắn đã được thu hồi
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setShowReactionBar(true)}
      onMouseLeave={() => {
        if (!isEmojiPickerOpen) setShowReactionBar(false);
      }}
      className={`flex gap-3 mb-4 group relative ${isSent ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isSent && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback>{senderName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isSent && senderName && (
          <span className="text-xs text-gray-500 dark:text-slate-400 mb-1 px-1">{senderName}</span>
        )}

        {/* Forwarded label */}
        {isForwarded && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 italic mb-1 px-1">
            <Forward className="w-3 h-3" /> Đã chuyển tiếp
          </div>
        )}

        <div className="relative group/bubble">
          {/* Replied message preview */}
          {replyTo && (
            <div
              className={`mb-1 p-2 rounded-xl text-xs border-l-4 bg-slate-100 dark:bg-slate-800/70 border-blue-500 text-slate-600 dark:text-slate-300 max-w-full truncate ${
                isSent ? 'rounded-tr-none' : 'rounded-tl-none'
              }`}
            >
              <p className="font-bold text-[10px] text-blue-600 dark:text-blue-400">
                {replyTo.senderName || 'Người dùng'}
              </p>
              <p className="truncate opacity-80">{replyTo.content || '[File/Media]'}</p>
            </div>
          )}

          {/* Text Message */}
          {(!type || type === 'TEXT') && (
            <div
              className={`rounded-2xl px-4 py-2.5 text-sm shadow-xs break-words max-w-full ${
                isSent
                  ? 'bg-blue-600 text-white rounded-tr-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-xs'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
            </div>
          )}

          {/* Media Attachments */}
          {type === 'IMAGE' && (
            <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 max-w-sm">
              {attachments?.[0]?.url ? (
                <img
                  src={attachments[0].url}
                  alt="Attachment"
                  className="max-h-72 w-auto object-cover hover:scale-105 transition duration-200"
                />
              ) : (
                <div className="p-4 bg-slate-100 dark:bg-slate-800 text-xs">Ảnh đang tải...</div>
              )}
            </div>
          )}

          {type === 'AUDIO' && (
            <div
              className={`flex items-center gap-3 p-3 rounded-2xl border ${
                isSent
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              {attachments?.[0]?.url && (
                <audio controls src={attachments[0].url} className="h-8 max-w-[220px]" />
              )}
            </div>
          )}

          {type === 'FILE' && (
            <div
              className={`flex items-center gap-3 p-3 rounded-2xl border ${
                isSent
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <FileText className="w-8 h-8 opacity-80" />
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-semibold truncate">{attachments?.[0]?.name || content || 'Document'}</p>
                <p className="text-[10px] opacity-70">
                  {attachments?.[0]?.size ? `${Math.round(attachments[0].size / 1024)} KB` : 'File đính kèm'}
                </p>
              </div>
              {attachments?.[0]?.url && (
                <a
                  href={attachments[0].url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-1.5 rounded-lg bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {/* Hover Quick Action Bar with Rich Reaction Palette */}
          {(showReactionBar || isEmojiPickerOpen) && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full shadow-xl px-2 py-1 z-30 transition animate-fade-in ${
                isSent ? 'right-full mr-2' : 'left-full ml-2'
              }`}
            >
              {/* Quick Emojis with Bounce Animation */}
              <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-1.5 mr-0.5">
                {QUICK_REACTIONS.slice(0, 6).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => reactToMessage(messageItem.id, emoji)}
                    className="hover:scale-135 active:scale-90 transition-transform duration-150 text-base p-0.5 cursor-pointer"
                    title={`Thả cảm xúc ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}

                {/* More Emojis Popover */}
                <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="p-1 hover:text-blue-600 text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Thêm cảm xúc khác"
                    >
                      <SmilePlus className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="center"
                    className="w-64 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl grid grid-cols-6 gap-1 z-50"
                  >
                    {ALL_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          reactToMessage(messageItem.id, emoji);
                          setIsEmojiPickerOpen(false);
                        }}
                        className="text-lg p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:scale-125 active:scale-95 transition cursor-pointer flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>

              <button
                onClick={() => setReplyingTo(messageItem)}
                className="p-1.5 hover:text-blue-600 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                title="Trả lời"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setForwardingMessage(messageItem)}
                className="p-1.5 hover:text-blue-600 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                title="Chuyển tiếp"
              >
                <Forward className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => pinMessage(messageItem.id)}
                className="p-1.5 hover:text-amber-500 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                title="Ghim tin nhắn"
              >
                <Pin className="w-3.5 h-3.5" />
              </button>

              {isSent && (
                <button
                  onClick={() => unsendMessage(messageItem.id)}
                  className="p-1.5 hover:text-red-600 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                  title="Thu hồi tin nhắn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Grouped Reactions list with Interactive Badges */}
        {groupedReactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1.5 ${isSent ? 'justify-end' : 'justify-start'}`}>
            {groupedReactions.map((item) => (
              <button
                key={item.emoji}
                onClick={() => reactToMessage(messageItem.id, item.emoji)}
                title={item.users.length > 0 ? item.users.join(', ') : `${item.count} người`}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shadow-2xs cursor-pointer transform hover:scale-110 active:scale-95 transition-all duration-150 ${
                  item.hasReacted
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                <span className="text-sm leading-none">{item.emoji}</span>
                <span className="text-[11px] font-bold">{item.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp & Read receipts */}
        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-gray-400">
          <span>{timestamp || createdAt}</span>
          {isSent && (
            <span>
              {isRead ? (
                <CheckCheck className="w-3 h-3 text-blue-500" />
              ) : (
                <Check className="w-3 h-3 text-gray-400" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
