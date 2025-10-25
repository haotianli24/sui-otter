"use client";

import { useState, useEffect } from "react";
import { BlockchainConversationList } from "@/components/messages/blockchain-conversation-list";
import { BlockchainMessageBubble } from "@/components/messages/blockchain-message-bubble";
import { MessageInput } from "@/components/messages/message-input";
import { EmptyMessages } from "@/components/messages/empty-messages";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMessaging } from "@/contexts/messaging-context";
import { useWallets } from "@mysten/dapp-kit";

export default function MessagesPage() {
    const { currentWallet } = useWallets();
    const { channels, messages, currentUser, sendMessage, loadMessages } = useMessaging();
    const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>();

    // Auto-select first channel if available
    useEffect(() => {
        if (channels.length > 0 && !selectedChannelId) {
            setSelectedChannelId(channels[0].id);
        }
    }, [channels, selectedChannelId]);

    // Load messages when a channel is selected
    useEffect(() => {
        if (selectedChannelId) {
            loadMessages(selectedChannelId);
        }
    }, [selectedChannelId, loadMessages]);

    const selectedChannel = channels.find(c => c.id === selectedChannelId);
    const channelMessages = selectedChannelId ? messages[selectedChannelId] || [] : [];

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
        return formatAddress(channel.id);
    };

    // Using hardcoded wallet, no connection check needed

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
                                Channel ID: {formatAddress(selectedChannel.id)}
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 bg-background">
                        {channelMessages.map((message) => (
                            <BlockchainMessageBubble key={message.id} message={message} />
                        ))}
                    </div>

                    {/* Message input */}
                    <MessageInput onSend={handleSendMessage} />
                </div>
            ) : channels.length === 0 ? (
                <EmptyMessages />
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

