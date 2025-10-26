import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';

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
          {/* Use ReactMarkdown for AI messages, plain text for user */}
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <ReactMarkdown
              className="text-sm prose prose-sm dark:prose-invert max-w-none"
              components={{
                // Style markdown elements to match theme
                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                em: ({children}) => <em className="italic">{children}</em>,
                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({children}) => <li className="text-sm">{children}</li>,
                code: ({children}) => (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                pre: ({children}) => (
                  <pre className="bg-muted p-3 rounded-lg my-2 overflow-x-auto">
                    {children}
                  </pre>
                ),
                a: ({children, href}) => (
                  <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-primary pl-4 italic my-2">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          )}
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

