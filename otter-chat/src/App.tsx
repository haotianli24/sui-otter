import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading, Button } from "@radix-ui/themes";
import { SessionKeyProvider } from "./providers/SessionKeyProvider";
import { MessagingClientProvider } from "./providers/MessagingClientProvider";
import { useMessaging } from "./hooks/useMessaging";
import { useSessionKey } from "./providers/SessionKeyProvider";
import { useState } from "react";

function MessagingApp() {
    const currentAccount = useCurrentAccount();
    const { sessionKey, isInitializing, initializeManually, error } = useSessionKey();
    const { channels, createChannel, messages, sendMessage, fetchMessages, isCreatingChannel, isSendingMessage } = useMessaging();
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [newChannelAddress, setNewChannelAddress] = useState("");
    const [messageText, setMessageText] = useState("");

    if (!currentAccount) {
        return (
            <Container>
                <Box py="9">
                    <Heading size="8" mb="4">Otter Chat</Heading>
                    <ConnectButton />
                </Box>
            </Container>
        );
    }

    if (!sessionKey) {
        return (
            <Container>
                <Box py="9">
                    <Heading size="6" mb="4">Initialize Session</Heading>
                    <p style={{ marginBottom: '1rem' }}>
                        Click below to sign a message and create your encrypted messaging session.
                    </p>
                    {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error.message}</p>}
                    <Button onClick={initializeManually} disabled={isInitializing}>
                        {isInitializing ? "Initializing..." : "Initialize Session"}
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container>
            <Box py="6">
                <Flex justify="between" align="center" mb="6">
                    <Heading size="8">Otter Chat</Heading>
                    <ConnectButton />
                </Flex>

                {/* Create Channel */}
                <Box mb="6" style={{ padding: '1rem', border: '1px solid var(--gray-6)', borderRadius: '8px' }}>
                    <Heading size="4" mb="3">Create New Channel</Heading>
                    <Flex gap="2">
                        <input
                            type="text"
                            placeholder="Recipient address (0x...)"
                            value={newChannelAddress}
                            onChange={(e) => setNewChannelAddress(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid var(--gray-6)',
                                background: 'var(--gray-2)',
                                color: 'var(--gray-12)'
                            }}
                        />
                        <Button
                            onClick={async () => {
                                if (newChannelAddress) {
                                    await createChannel([newChannelAddress]);
                                    setNewChannelAddress("");
                                }
                            }}
                            disabled={!newChannelAddress || isCreatingChannel}
                        >
                            {isCreatingChannel ? "Creating..." : "Create"}
                        </Button>
                    </Flex>
                </Box>

                {/* Channel List */}
                <Box mb="6">
                    <Heading size="4" mb="3">Channels ({channels.length})</Heading>
                    {channels.length === 0 ? (
                        <p>No channels yet. Create one above!</p>
                    ) : (
                        <Flex direction="column" gap="2">
                            {channels.map((channel) => (
                                <Box
                                    key={channel.id.id}
                                    p="3"
                                    style={{
                                        border: '1px solid var(--gray-6)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: selectedChannel === channel.id.id ? 'var(--gray-3)' : 'var(--gray-2)'
                                    }}
                                    onClick={() => {
                                        setSelectedChannel(channel.id.id);
                                        fetchMessages(channel.id.id);
                                    }}
                                >
                                    <p><strong>Channel:</strong> {channel.id.id.slice(0, 16)}...</p>
                                    <p><small>{channel.messages_count} messages</small></p>
                                </Box>
                            ))}
                        </Flex>
                    )}
                </Box>

                {/* Messages */}
                {selectedChannel && (
                    <Box style={{ padding: '1rem', border: '1px solid var(--gray-6)', borderRadius: '8px' }}>
                        <Heading size="4" mb="3">Messages</Heading>
                        <Box mb="4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {messages.length === 0 ? (
                                <p>No messages yet</p>
                            ) : (
                                messages.map((msg, i) => (
                                    <Box key={i} mb="2" p="2" style={{ background: 'var(--gray-3)', borderRadius: '4px' }}>
                                        <p><strong>{msg.sender.slice(0, 8)}...:</strong> {msg.text}</p>
                                        <small>{new Date(Number(msg.createdAtMs)).toLocaleString()}</small>
                                    </Box>
                                ))
                            )}
                        </Box>
                        <Flex gap="2">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && messageText && !isSendingMessage) {
                                        sendMessage(selectedChannel, messageText);
                                        setMessageText("");
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    border: '1px solid var(--gray-6)',
                                    background: 'var(--gray-2)',
                                    color: 'var(--gray-12)'
                                }}
                            />
                            <Button
                                onClick={() => {
                                    if (messageText) {
                                        sendMessage(selectedChannel, messageText);
                                        setMessageText("");
                                    }
                                }}
                                disabled={!messageText || isSendingMessage}
                            >
                                {isSendingMessage ? "Sending..." : "Send"}
                            </Button>
                        </Flex>
                    </Box>
                )}
            </Box>
        </Container>
    );
}

function App() {
    return (
        <SessionKeyProvider>
            <MessagingClientProvider>
                <MessagingApp />
            </MessagingClientProvider>
        </SessionKeyProvider>
    );
}

export default App;

