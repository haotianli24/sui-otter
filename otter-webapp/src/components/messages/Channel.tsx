import { useEffect, useRef } from 'react';
import { useMessaging } from '../../hooks/useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ArrowLeft } from 'lucide-react';
import { MessageInput } from './message-input';
import { MessageWithMedia } from './message-with-media';
import { getDisplayName, useUsername } from '../../hooks/useUsernameRegistry';
import { Avatar, AvatarFallback } from '../ui/avatar';

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

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        // Don't scroll if we're loading older messages
        if (!isLoadingOlderRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        // Reset the flag after messages update
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


    // Component to display message with profile picture and username
    const MessageWithProfile = ({ msg, isCurrentUser }: { msg: any, isCurrentUser: boolean }) => {
        const { data: username } = useUsername(msg.sender);
        const displayName = username || getDisplayName(msg.sender);
        const avatarFallback = username ? username.slice(0, 2).toUpperCase() : getDisplayName(msg.sender).slice(0, 2).toUpperCase();

        return (
            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} gap-3`}>
                {/* Profile picture and username for other users */}
                {!isCurrentUser && (
                    <div className="flex flex-col items-center gap-1">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {avatarFallback}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground text-center max-w-[60px] truncate">
                            {displayName}
                        </span>
                    </div>
                )}
                
                <div className={`max-w-[70%] rounded-lg p-3 ${isCurrentUser
                    ? 'bg-primary text-primary-foreground border-2 border-primary/20 shadow-sm'
                    : 'bg-muted border border-border'
                    }`}>
                    <MessageWithMedia
                        content={msg.text}
                        isOwn={isCurrentUser}
                        senderName={displayName}
                        groupName="Channel"
                    />
                    <p className={`text-xs mt-1 ${isCurrentUser ? 'opacity-70' : 'text-muted-foreground'}`}>
                        {formatTimestamp(msg.createdAtMs)}
                    </p>
                </div>
            </div>
        );
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
        <div className="flex flex-col h-full bg-card border border-border">
            {/* Header */}
            <div className="border-b border-border flex-shrink-0 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold">Channel</h2>
                        <p className="text-xs text-muted-foreground">
                            {channelId.slice(0, 16)}...{channelId.slice(-4)}
                        </p>
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
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
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
                                <MessageWithProfile 
                                    key={i} 
                                    msg={msg} 
                                    isCurrentUser={isCurrentUser} 
                                />
                            );
                        })}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-border flex-shrink-0">
                {channelError && (
                    <div className="p-4 border-b border-destructive/20 bg-destructive/10">
                        <p className="text-sm text-destructive">{channelError}</p>
                    </div>
                )}

                <MessageInput
                    onSend={handleSendMessage}
                    disabled={isSendingMessage}
                />
            </div>
        </div>
    );
}

