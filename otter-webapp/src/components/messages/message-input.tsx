

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Smile, Video, FileText, File, Image } from "lucide-react";
import { getFileMetadata, getFileIcon, formatFileSize, validateFile } from "../../lib/walrus-service";

interface MessageInputProps {
    onSend: (content: string, mediaFile?: File) => void;
    disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
    const [message, setMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileMetadata, setFileMetadata] = useState<{ filename: string; mimeType: string; size: number; category: 'image' | 'video' | 'document' | 'other' } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (message.trim() || selectedFile) {
            onSend(message, selectedFile || undefined);
            setMessage("");
            setSelectedFile(null);
            setPreviewUrl(null);
            setFileMetadata(null);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file
            const validation = validateFile(file);
            if (!validation.valid) {
                alert(validation.error);
                return;
            }

            setSelectedFile(file);
            const metadata = getFileMetadata(file);
            setFileMetadata(metadata);

            // Create preview URL for images and videos
            if (metadata.category === 'image' || metadata.category === 'video') {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setFileMetadata(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 border-t border-border bg-card">
            {/* File preview */}
            {selectedFile && fileMetadata && (
                <div className="mb-3 relative">
                    {fileMetadata.category === 'image' && previewUrl && (
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                        />
                    )}
                    {fileMetadata.category === 'video' && previewUrl && (
                        <video
                            src={previewUrl}
                            className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                            controls
                        />
                    )}
                    {(fileMetadata.category === 'document' || fileMetadata.category === 'other') && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg max-w-[300px]">
                            {(() => {
                                const IconComponent = getFileIcon(fileMetadata.category);
                                return <IconComponent className="h-8 w-8 text-muted-foreground" />;
                            })()}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{fileMetadata.filename}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(fileMetadata.size)}</p>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={removeFile}
                    >
                        ×
                    </Button>
                </div>
            )}

            <div className="flex items-end gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    title="Attach file"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
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
                    className="flex-1 min-h-[44px] max-h-[120px] px-4 py-3 bg-background border border-input text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                    rows={1}
                    disabled={disabled}
                />
                <Button
                    onClick={handleSend}
                    disabled={(!message.trim() && !selectedFile) || disabled}
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

