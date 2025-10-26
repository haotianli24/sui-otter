import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} relative z-10`}>
      {/* Avatar for AI */}
      {!isUser && (
        <div className="flex flex-col items-center gap-1">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-green-500 text-white">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground text-center max-w-[60px] truncate">
            Otter AI
          </span>
        </div>
      )}

      {/* Message content */}
      <div className={`flex flex-col max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border'
          }`}
          style={{
            backgroundColor: isUser
              ? 'hsl(var(--primary))'
              : 'hsl(var(--card))'
          }}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        </div>
      </div>

      {/* Avatar for User */}
      {isUser && (
        <div className="flex flex-col items-center gap-1">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground text-center max-w-[60px] truncate">
            You
          </span>
        </div>
      )}
    </div>
  );
}

