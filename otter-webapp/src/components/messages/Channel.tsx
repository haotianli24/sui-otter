import { useEffect, useRef } from 'react';
import { useMessaging } from '../../hooks/useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ArrowLeft } from 'lucide-react';
import { MessageInput } from './message-input';
import { MessageWithMedia } from './message-with-media';
import { ZeroBackground } from '../ui/zero-background';

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

    // Fetch channel and messages on mount
    useEffect(() => {
        if (isReady && channelId) {
            getChannelById(channelId).then(() => {
                fetchMessages(channelId);
            });

            // Auto-refresh messages every 10 seconds (only for the current channel)
            const interval = setInterval(() => {
                if (isReady && channelId) {
                    fetchMessages(channelId);
                }
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [isReady, channelId, getChannelById, fetchMessages]);

    // Reset loading flag after messages update
    useEffect(() => {
        isLoadingOlderRef.current = false;
    }, [messages]);

    const handleSendMessage = async (message: string, mediaFile?: File) => {
        if (!message.trim() && !mediaFile || isSendingMessage) {
            return;
        }

        const result = await sendMessage(channelId, message, mediaFile);
        if (result) {
            // MessageInput will handle clearing the input
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
        // Show a more user-friendly name instead of wallet address
        return `User ${address.slice(-4)}`;
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
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-border flex-shrink-0 p-6 bg-card">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <h2 className="section-heading">Direct Message</h2>
                        <p className="muted-text">
                            Private conversation
                        </p>
                    </div>
                    {currentChannel && (
                        <div className="flex gap-6 text-sm">
                            <div>
                                <p className="small-text">Messages</p>
                                <p className="card-heading">{currentChannel.messages_count}</p>
                            </div>
                            <div>
                                <p className="small-text">Members</p>
                                <p className="card-heading">{currentChannel.auth.member_permissions.contents.length}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-4 min-h-0 bg-background relative">
                <ZeroBackground />
                <div
                    className="relative z-10"
                    onMouseMove={(e) => {
                        // Forward mouse move events to the ZeroBackground
                        const zeroBackground = e.currentTarget.parentElement?.querySelector('[data-zero-background]');
                        if (zeroBackground) {
                            zeroBackground.dispatchEvent(new MouseEvent('mousemove', {
                                clientX: e.clientX,
                                clientY: e.clientY,
                                bubbles: true
                            }));
                        }
                    }}
                    onMouseLeave={(e) => {
                        // Forward mouse leave events to the ZeroBackground
                        const zeroBackground = e.currentTarget.parentElement?.querySelector('[data-zero-background]');
                        if (zeroBackground) {
                            zeroBackground.dispatchEvent(new MouseEvent('mouseleave', {
                                clientX: e.clientX,
                                clientY: e.clientY,
                                bubbles: true
                            }));
                        }
                    }}
                >
                    {hasMoreMessages && (
                        <div className="text-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLoadMore}
                                disabled={isFetchingMessages}
                            >
                                {isFetchingMessages ? 'Loading...' : 'Load previous messages'}
                            </Button>
                        </div>
                    )}

                    {isFetchingMessages && messages.length === 0 ? (
                        <div className="loading-state">
                            <div className="loading-content">
                                <p className="muted-text">Loading conversation...</p>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="empty-state">
                            <div className="text-center">
                                <p className="section-heading mb-2">No messages yet</p>
                                <p className="muted-text">Send a message to start the conversation</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg, i) => {
                                const isCurrentUser = msg.sender === currentAccount?.address;
                                return (
                                    <div
                                        key={i}
                                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} relative z-10`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg p-4 relative z-10 ${isCurrentUser
                                                ? 'bg-gray-100 text-black shadow-sm'
                                                : 'bg-card border border-border'
                                                }`}
                                        >
                                            {!isCurrentUser && (
                                                <p className="small-text mb-2">
                                                    {formatAddress(msg.sender)}
                                                </p>
                                            )}
                                            <MessageWithMedia
                                                content={msg.text}
                                                isOwn={isCurrentUser}
                                                senderName={formatAddress(msg.sender)}
                                                groupName="Channel"
                                            />
                                            <p className={`small-text mt-2 ${isCurrentUser ? 'opacity-100' : 'muted-text'}`}>
                                                {formatTimestamp(msg.createdAtMs)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-border flex-shrink-0 bg-card">
                {channelError && (
                    <div className="p-4 border-b border-destructive/20 bg-destructive/10">
                        <p className="text-sm text-destructive">{channelError}</p>
                    </div>
                )}

                <div className="p-6">
                    <MessageInput
                        onSend={handleSendMessage}
                        disabled={isSendingMessage}
                    />
                </div>
            </div>
        </div>
    );
}

