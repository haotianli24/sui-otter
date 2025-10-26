

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Smile } from "lucide-react";

interface MessageInputProps {
    onSend: (content: string) => void;
}

export function MessageInput({ onSend }: MessageInputProps) {
    const [message, setMessage] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "44px";
            textareaRef.current.style.height = `${Math.min(
                textareaRef.current.scrollHeight,
                120
            )}px`;
        }
    }, [message]);

    const handleSend = () => {
        if (message.trim()) {
            onSend(message);
            setMessage("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
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
                    title="Attach file"
                >
                    <Paperclip className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    title="Add emoji"
                >
                    <Smile className="h-5 w-5" />
                </Button>
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message... (Shift+Enter for new line)"
                    className="flex-1 min-h-[44px] max-h-[120px] px-4 py-3 bg-background border border-input text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={1}
                />
                <Button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    size="icon"
                    className="flex-shrink-0"
                    title="Send message (Enter)"
                >
                    <Send className="h-5 w-5" />
                </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-1">
                Tip: Use <kbd className="px-1.5 py-0.5 bg-muted text-xs">/send @user 10 SUI</kbd> to send crypto
            </p>
        </div>
    );
}

