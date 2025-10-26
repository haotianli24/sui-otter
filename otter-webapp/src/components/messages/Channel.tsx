import { useEffect, useState, useRef } from 'react';
import { useMessaging } from '../../hooks/useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Send } from 'lucide-react';

interface ChannelProps {
    channelId: string;
    onBack: () => void;
}

export function Channel({ channelId, onBack }: ChannelProps) {
    const currentAccount = useCurrentAccount();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isLoadingOlderRef = useRef(false);
    const {
        currentChannel,
        messages,
        getChannelById,
        fetchMessages,
        sendMessage,
        isFetchingMessages,
        isSendingMessage,
        messagesCursor,
        hasMoreMessages,
        channelError,
        isReady,
    } = useMessaging();

    const [messageText, setMessageText] = useState('');

    // Fetch channel and messages on mount
    useEffect(() => {
        if (isReady && channelId) {
            getChannelById(channelId).then(() => {
                fetchMessages(channelId);
            });

            // Auto-refresh messages every 10 seconds
            const interval = setInterval(() => {
                fetchMessages(channelId);
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [isReady, channelId, getChannelById, fetchMessages]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        // Don't scroll if we're loading older messages
        if (!isLoadingOlderRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        // Reset the flag after messages update
        isLoadingOlderRef.current = false;
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!messageText.trim() || isSendingMessage) {
            return;
        }

        const result = await sendMessage(channelId, messageText);
        if (result) {
            setMessageText(''); // Clear input on success
        }
    };

    const handleLoadMore = () => {
        if (messagesCursor && !isFetchingMessages) {
            isLoadingOlderRef.current = true;
            fetchMessages(channelId, messagesCursor);
        }
    };

    const formatTimestamp = (ms: string | number | bigint) => {
        const date = new Date(Number(ms));
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatAddress = (address: string) => {
        if (!address) return "Unknown";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (!isReady) {
        return (
            <Card>
                <CardContent className="p-8">
                    <p className="text-center text-muted-foreground">Initializing messaging client...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col h-[calc(100vh-200px)]">
            <CardHeader className="border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <CardTitle>Channel</CardTitle>
                        <CardDescription className="text-xs">
                            {channelId.slice(0, 16)}...{channelId.slice(-4)}
                        </CardDescription>
                    </div>
                    {currentChannel && (
                        <div className="flex gap-4 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Messages</p>
                                <p className="font-medium">{currentChannel.messages_count}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Members</p>
                                <p className="font-medium">{currentChannel.auth.member_permissions.contents.length}</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {hasMoreMessages && (
                    <div className="text-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLoadMore}
                            disabled={isFetchingMessages}
                        >
                            {isFetchingMessages ? 'Loading...' : 'Load older messages'}
                        </Button>
                    </div>
                )}

                {isFetchingMessages && messages.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">Loading messages...</p>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {messages.map((msg, i) => {
                            const isCurrentUser = msg.sender === currentAccount?.address;
                            return (
                                <div
                                    key={i}
                                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg p-3 ${isCurrentUser
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted'
                                            }`}
                                    >
                                        {!isCurrentUser && (
                                            <p className="text-xs opacity-70 mb-1">
                                                {formatAddress(msg.sender)}
                                            </p>
                                        )}
                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                        <p className={`text-xs mt-1 ${isCurrentUser ? 'opacity-70' : 'text-muted-foreground'}`}>
                                            {formatTimestamp(msg.createdAtMs)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </CardContent>

            <div className="border-t p-4">
                {channelError && (
                    <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                        {channelError}
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        disabled={isSendingMessage}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        disabled={!messageText.trim() || isSendingMessage}
                        size="icon"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </Card>
    );
}

