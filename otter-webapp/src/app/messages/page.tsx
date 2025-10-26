"use client";

import { useState, useEffect } from "react";
import { BlockchainConversationList } from "@/components/messages/blockchain-conversation-list";
import { BlockchainMessageBubble } from "@/components/messages/blockchain-message-bubble";
import { MessageInput } from "@/components/messages/message-input";
import { EmptyMessages } from "@/components/messages/empty-messages";
import { SdkStatus } from "@/components/messages/sdk-status";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMessaging } from "@/hooks/messagingHandler";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSessionKey } from "@/providers/SessionKeyProvider";

export default function MessagesPage() {
    const { channels, messages, currentChannel, sendMessage, fetchMessages, getChannelById, isReady } = useMessaging();
    const currentAccount = useCurrentAccount();
    const { sessionKey } = useSessionKey();
    const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>();
    const [showStatus, setShowStatus] = useState(false);

    // Show SDK status if not ready
    useEffect(() => {
        if (currentAccount && !isReady) {
            setShowStatus(true);
        } else if (isReady && channels.length === 0) {
            // Keep showing status when ready but no channels
            setShowStatus(true);
        } else {
            // Hide status once they have channels and are ready
            setShowStatus(false);
        }
    }, [currentAccount, isReady, channels.length]);

    // Auto-select first channel if available
    useEffect(() => {
        if (channels.length > 0 && !selectedChannelId) {
            const firstChannelId = channels[0].id.id;
            setSelectedChannelId(firstChannelId);
        }
    }, [channels, selectedChannelId]);

    // Load messages when a channel is selected
    useEffect(() => {
        if (selectedChannelId) {
            getChannelById(selectedChannelId);
            fetchMessages(selectedChannelId);
        }
    }, [selectedChannelId, fetchMessages, getChannelById]);

    const selectedChannel = channels.find(c => c.id.id === selectedChannelId);
    const channelMessages = messages || [];

    const handleSendMessage = async (content: string) => {
        if (!selectedChannelId) return;

        try {
            await sendMessage(selectedChannelId, content);
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const formatAddress = (address: string) => {
        if (!address) return "Unknown";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getOtherParticipant = (channel: any) => {
        // For now, we'll show the channel ID since we don't have member info
        return formatAddress(channel.id.id);
    };

    // Show SDK status if user is connected but not ready
    if (currentAccount && !isReady && showStatus) {
        return (
            <div className="flex h-full items-center justify-center bg-background p-6">
                <div className="max-w-2xl w-full">
                    <SdkStatus />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* Left panel - Conversation list */}
            <div className="w-80 bg-card border-r border-border">
                <BlockchainConversationList
                    selectedId={selectedChannelId}
                    onSelect={setSelectedChannelId}
                />
            </div>

            {/* Right panel - Active conversation */}
            {selectedChannel ? (
                <div className="flex-1 flex flex-col border-l border-border">
                    {/* Conversation header */}
                    <div className="h-16 px-6 border-b border-border bg-card flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {getOtherParticipant(selectedChannel).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-semibold">
                                {getOtherParticipant(selectedChannel)}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Channel ID: {formatAddress(selectedChannel.id.id)}
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 bg-background">
                        {channelMessages.map((message, index) => (
                            <BlockchainMessageBubble key={`${message.sender}-${message.createdAtMs}-${index}`} message={message} />
                        ))}
                    </div>

                    {/* Message input */}
                    <MessageInput onSend={handleSendMessage} />
                </div>
            ) : channels.length === 0 && isReady ? (
                <div className="flex-1 flex items-center justify-center bg-background p-6">
                    <div className="max-w-2xl w-full space-y-6">
                        <SdkStatus />
                        <EmptyMessages />
                    </div>
                </div>
            ) : channels.length === 0 && !isReady ? (
                <div className="flex-1 flex items-center justify-center bg-background p-6">
                    <div className="max-w-2xl w-full">
                        <SdkStatus />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-background">
                    <div className="text-center text-muted-foreground">
                        <p className="text-lg">Select a conversation to start messaging</p>
                    </div>
                </div>
            )}
        </div>
    );
}

