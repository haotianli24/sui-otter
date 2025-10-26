import React, { useEffect, useRef, useState } from 'react';
import { useMessaging } from '../../hooks/useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { GradientAvatar } from '../ui/gradient-avatar';
import { ArrowLeft } from 'lucide-react';
import { MessageInput } from './message-input';
import { MessageWithMedia } from '@/components/messages/message-with-media';
import { ZeroBackground } from '../ui/zero-background';
import { UserProfilePopup } from '../ui/user-profile-popup';
import { useUsername } from '../../hooks/useUsernameRegistry';
import { getDisplayName } from '../../contexts/UserProfileContext';

interface ChannelProps {
    channelId: string;
    onBack: () => void;
}

export function Channel({ channelId, onBack }: ChannelProps) {
    const currentAccount = useCurrentAccount();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const isLoadingOlderRef = useRef(false);
    const [profilePopup, setProfilePopup] = useState<{
        isOpen: boolean;
        address: string;
        position: { x: number; y: number };
    }>({
        isOpen: false,
        address: '',
        position: { x: 0, y: 0 }
    });
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

    // Determine the other member (not the current user)
    const otherMember = React.useMemo(() => {
        if (!currentChannel || !currentAccount) return null;

        // Try to get from member permissions (DecryptedChannelObject structure)
        if (currentChannel.auth?.member_permissions?.contents) {
            const member = currentChannel.auth.member_permissions.contents.find((perm: any) => perm.key !== currentAccount.address)?.key;
            if (member) return member;
        }

        // Fallback: try to get from the first message sender who isn't the current user
        if (messages.length > 0) {
            const otherSender = messages.find(msg => msg.sender !== currentAccount.address)?.sender;
            if (otherSender) return otherSender;
        }

        return null;
    }, [currentChannel, currentAccount, messages]);

    // Debug logging for Channel component
    React.useEffect(() => {
        if (currentChannel) {
            console.log('Channel component debug:', {
                channelId,
                currentAccount: currentAccount?.address,
                currentChannel,
                otherMember,
                messagesCount: messages.length
            });
        }
    }, [currentChannel, currentAccount, otherMember, messages.length]);

    // Fetch channel and messages on mount
    useEffect(() => {
        if (isReady && channelId) {
            getChannelById(channelId).then(() => {
                fetchMessages(channelId).then(() => {
                    // Scroll to bottom when messages first load
                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                });
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

    // Auto-scroll functionality removed

    // Scroll tracking removed

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

    const handleProfileClick = (address: string, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        // Debug logging to help identify the issue
        console.log('Channel handleProfileClick:', {
            channelId,
            currentAccount: currentAccount?.address,
            clickedAddress: address,
            currentChannel: currentChannel
        });

        const rect = event.currentTarget.getBoundingClientRect();
        setProfilePopup({
            isOpen: true,
            address,
            position: {
                x: rect.left + rect.width / 2 - 160, // Center the popup
                y: rect.top - 10
            }
        });
    };

    const closeProfilePopup = () => {
        setProfilePopup({
            isOpen: false,
            address: '',
            position: { x: 0, y: 0 }
        });
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
                </div>
            </div>

            {/* Messages Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-background relative">
                <div className="absolute inset-0 overflow-hidden">
                    <ZeroBackground />
                </div>
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
                                    <MessageItem
                                        key={i}
                                        message={msg}
                                        isCurrentUser={isCurrentUser}
                                        onProfileClick={handleProfileClick}
                                        formatTimestamp={formatTimestamp}
                                        currentAccount={currentAccount}
                                    />
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
                        <p className="text-sm text-destructive/70">{channelError}</p>
                    </div>
                )}

                <MessageInput
                    onSend={handleSendMessage}
                    disabled={isSendingMessage}
                />
            </div>

            {/* User Profile Popup */}
            <UserProfilePopup
                address={profilePopup.address}
                isOpen={profilePopup.isOpen}
                onClose={closeProfilePopup}
                position={profilePopup.position}
            />
        </div>
    );
}

// Message Item Component
interface MessageItemProps {
    message: any;
    isCurrentUser: boolean;
    onProfileClick: (address: string, event: React.MouseEvent) => void;
    formatTimestamp: (ms: string | number | bigint) => string;
    currentAccount: any;
}

function MessageItem({ message, isCurrentUser, onProfileClick, formatTimestamp, currentAccount }: MessageItemProps) {
    const { data: username } = useUsername(message.sender);
    const displayName = username || getDisplayName(message.sender);

    return (
        <div className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'} relative z-10`}>
            {/* Avatar for other users */}
            {!isCurrentUser && (
                <div className="flex flex-col items-center gap-1">
                    <div
                        className="h-8 w-8 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => onProfileClick(message.sender, e)}
                    >
                        <GradientAvatar
                            address={message.sender}
                            size="sm"
                            className="h-8 w-8"
                        />
                    </div>
                    <span className="text-xs text-muted-foreground text-center max-w-[60px] truncate">
                        {displayName}
                    </span>
                </div>
            )}

            {/* Message content */}
            <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`px-4 py-2 rounded-2xl backdrop-blur-md border ${isCurrentUser
                        ? "bg-primary/10 border-primary/30"
                        : "bg-card/80 border-border/50"
                        }`}
                >
                    <MessageWithMedia
                        content={message.text}
                        isOwn={isCurrentUser}
                        senderName={displayName}
                        groupName="Channel"
                        currentUserAddress={currentAccount?.address}
                    />
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs text-muted-foreground`}>
                        {formatTimestamp(message.createdAtMs)}
                    </span>
                </div>
            </div>
        </div>
    );
}

