"use client";

import { useState, useEffect } from "react";
import { BlockchainConversationList } from "@/components/messages/blockchain-conversation-list";
import { BlockchainMessageBubble } from "@/components/messages/blockchain-message-bubble";
import { MessageInput } from "@/components/messages/message-input";
import { EmptyMessages } from "@/components/messages/empty-messages";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessaging } from "@/contexts/messaging-context";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { AlertCircle, Key, Plus, X } from "lucide-react";
import { isValidSuiAddress } from "@mysten/sui/utils";

export default function MessagesPage() {
    const currentAccount = useCurrentAccount();
    const { 
        channels, 
        messages, 
        sendMessage, 
        loadMessages, 
        isReady, 
        initializeSession,
        isInitializing,
        error,
        createChannel,
        isLoading
    } = useMessaging();
    const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>();
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [recipientAddress, setRecipientAddress] = useState("");
    const [createChannelError, setCreateChannelError] = useState<string | null>(null);

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

    const handleCreateChannel = async () => {
        setCreateChannelError(null);
        
        if (!recipientAddress.trim()) {
            setCreateChannelError("Please enter a recipient address");
            return;
        }

        if (!isValidSuiAddress(recipientAddress)) {
            setCreateChannelError("Invalid Sui address format");
            return;
        }

        if (currentAccount && recipientAddress.toLowerCase() === currentAccount.address.toLowerCase()) {
            setCreateChannelError("You cannot create a channel with yourself");
            return;
        }

        try {
            await createChannel(recipientAddress);
            setRecipientAddress("");
            setShowCreateChannel(false);
            setCreateChannelError(null);
        } catch (err) {
            setCreateChannelError(err instanceof Error ? err.message : "Failed to create channel");
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

    // Show wallet connection prompt if not connected
    if (!currentAccount) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <div className="text-center max-w-md px-6">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
                    <p className="text-muted-foreground">
                        Please connect your wallet to access secure messaging
                    </p>
                </div>
            </div>
        );
    }

    // Show session initialization prompt if not ready
    if (!isReady) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <div className="text-center max-w-md px-6">
                    <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-2xl font-semibold mb-2">Initialize Secure Messaging</h2>
                    <p className="text-muted-foreground mb-6">
                        To enable end-to-end encrypted messaging, you need to create a session key. 
                        This requires signing a message with your wallet.
                    </p>
                    {error && (
                        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}
                    <Button 
                        onClick={initializeSession}
                        disabled={isInitializing}
                        size="lg"
                    >
                        {isInitializing ? "Initializing..." : "Initialize Session"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                        Session lasts 30 minutes
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* Left panel - Conversation list */}
            <div className="w-80 bg-card border-r border-border flex flex-col">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Messages</h2>
                    <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => setShowCreateChannel(!showCreateChannel)}
                        title="Create new channel"
                    >
                        {showCreateChannel ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </Button>
                </div>

                {/* Create Channel Form */}
                {showCreateChannel && (
                    <div className="p-4 border-b border-border bg-muted/30">
                        <h3 className="text-sm font-semibold mb-3">Create New Channel</h3>
                        <div className="space-y-2">
                            <Input
                                placeholder="Recipient address (0x...)"
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                className="text-sm"
                            />
                            {createChannelError && (
                                <p className="text-xs text-destructive">{createChannelError}</p>
                            )}
                            <Button 
                                onClick={handleCreateChannel}
                                disabled={isLoading || !recipientAddress.trim()}
                                size="sm"
                                className="w-full"
                            >
                                {isLoading ? "Creating..." : "Create Channel"}
                            </Button>
                        </div>
                    </div>
                )}

                <BlockchainConversationList
                    selectedId={selectedChannelId}
                    onSelect={setSelectedChannelId}
                />
            </div>

            {/* Right panel - Active conversation */}
            {selectedChannel ? (
                <div className="flex-1 flex flex-col border-l border-border">
                    {/* Conversation header */}
                    <div className="h-28 px-6 border-b border-border bg-card flex items-center gap-3">
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
                        {channelMessages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            channelMessages.map((message) => (
                                <BlockchainMessageBubble key={message.id} message={message} />
                            ))
                        )}
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

