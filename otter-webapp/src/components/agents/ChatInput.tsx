import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          title="AI suggestions"
          disabled={disabled}
        >
          <Sparkles className="h-5 w-5" />
        </Button>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about Sui blockchain... (Shift+Enter for new line)"
          className="flex-1 min-h-[44px] max-h-[120px] px-4 py-3 bg-background border border-input text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          rows={1}
          disabled={disabled}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className="flex-shrink-0 bg-green-500 hover:bg-green-600"
          title="Send message (Enter)"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 px-1">
        Tip: Ask about trading, NFTs, communities, or any Sui blockchain topic
      </p>
    </div>
  );
}

