import { useState, useEffect } from "react";
import { MessageInput } from "../components/messages/message-input";
import { EmptyMessages } from "../components/messages/empty-messages";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useMessaging } from "../hooks/useMessaging";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { AlertCircle, Key, Plus, X } from "lucide-react";
import { isValidSuiAddress } from "@mysten/sui/utils";
import { SessionKeyProvider, useSessionKey } from "../providers/SessionKeyProvider";
import { MessagingClientProvider } from "../providers/MessagingClientProvider";

function MessagesPageContent() {
    const currentAccount = useCurrentAccount();
    const { sessionKey, isInitializing, initializeManually, error } = useSessionKey();
    const {
        channels,
        messages,
        sendMessage,
        fetchMessages,
        isReady,
        createChannel,
        isCreatingChannel
    } = useMessaging();
    const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>();
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [recipientAddress, setRecipientAddress] = useState("");
    const [createChannelError, setCreateChannelError] = useState<string | null>(null);

    // Show wallet connection prompt if no wallet connected
    if (!currentAccount) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background">
                <div className="text-center text-muted-foreground">
                    <p className="text-lg">Please connect your wallet to use messaging</p>
                </div>
            </div>
        );
    }

    // Show session initialization if no session key
    if (!sessionKey) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-semibold">Initialize Secure Messaging</h2>
                    <p className="text-muted-foreground">
                        Click below to sign a message and create your encrypted messaging session.
                    </p>
                    {error && <p className="text-red-500">{error.message}</p>}
                    <Button onClick={initializeManually} disabled={isInitializing}>
                        {isInitializing ? "Initializing..." : "Initialize Session"}
                    </Button>
                </div>
            </div>
        );
    }

    // Auto-select first channel if available
    useEffect(() => {
        if (channels.length > 0 && !selectedChannelId) {
            setSelectedChannelId(channels[0].id.id);
        }
    }, [channels, selectedChannelId]);

    // Load messages when a channel is selected
    useEffect(() => {
        if (selectedChannelId) {
            fetchMessages(selectedChannelId);
        }
    }, [selectedChannelId, fetchMessages]);

    const selectedChannel = channels.find(c => c.id.id === selectedChannelId);
    const channelMessages = messages;

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
            await createChannel([recipientAddress]);
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
        return formatAddress(channel.id.id);
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

    // Show loading state if not ready
    if (!isReady) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <div className="text-center">
                    <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
                    <h2 className="text-2xl font-semibold mb-2">Initializing Secure Messaging</h2>
                    <p className="text-muted-foreground">
                        Setting up end-to-end encrypted messaging...
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipientAddress(e.target.value)}
                                className="text-sm"
                            />
                            {createChannelError && (
                                <p className="text-xs text-destructive">{createChannelError}</p>
                            )}
                            <Button
                                onClick={handleCreateChannel}
                                disabled={isCreatingChannel || !recipientAddress.trim()}
                                size="sm"
                                className="w-full"
                            >
                                {isCreatingChannel ? "Creating..." : "Create Channel"}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {channels.length === 0 ? (
                        <p className="p-4 text-muted-foreground">No channels yet. Create one above!</p>
                    ) : (
                        <div className="p-2 space-y-1">
                            {channels.map((channel) => (
                                <div
                                    key={channel.id.id}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedChannelId === channel.id.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-accent hover:text-accent-foreground'
                                        }`}
                                    onClick={() => {
                                        setSelectedChannelId(channel.id.id);
                                        fetchMessages(channel.id.id);
                                    }}
                                >
                                    <p className="font-medium">{channel.id.id.slice(0, 16)}...</p>
                                    <p className="text-sm opacity-75">{channel.messages_count || 0} messages</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
                                Channel ID: {formatAddress(selectedChannel.id.id)}
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
                            <div className="space-y-4">
                                {channelMessages.map((message, index) => (
                                    <div key={index} className="flex gap-3">
                                        <Avatar className="h-8 w-8 mt-1">
                                            <AvatarFallback className="text-xs">
                                                {message.sender.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium">
                                                    {formatAddress(message.sender)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(Number(message.createdAtMs)).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm bg-muted p-3 rounded-lg">
                                                {message.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
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

export default function MessagesPage() {
    return (
        <SessionKeyProvider>
            <MessagingClientProvider>
                <MessagesPageContent />
            </MessagingClientProvider>
        </SessionKeyProvider>
    );
}
