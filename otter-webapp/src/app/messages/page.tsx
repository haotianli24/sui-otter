"use client";

import { useState } from "react";
import { ConversationList } from "@/components/messages/conversation-list";
import { MessageBubble } from "@/components/messages/message-bubble";
import { MessageInput } from "@/components/messages/message-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    mockConversations,
    mockMessages,
    Message,
    currentUser,
} from "@/lib/mock-data";

export default function MessagesPage() {
    const [selectedConvId, setSelectedConvId] = useState<string | undefined>(
        mockConversations[0]?.id
    );
    const [messages, setMessages] = useState(mockMessages);

    const selectedConversation = mockConversations.find(
        (c) => c.id === selectedConvId
    );

    const conversationMessages = selectedConvId
        ? messages[selectedConvId] || []
        : [];

    const handleSendMessage = (content: string) => {
        if (!selectedConvId) return;

        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            content,
            timestamp: new Date(),
            type: "text",
        };

        setMessages((prev) => ({
            ...prev,
            [selectedConvId]: [...(prev[selectedConvId] || []), newMessage],
        }));
    };

    return (
        <div className="flex h-full">
            {/* Left panel - Conversation list */}
            <div className="w-80 bg-card border-r border-border">
                <ConversationList
                    conversations={mockConversations}
                    selectedId={selectedConvId}
                    onSelect={setSelectedConvId}
                />
            </div>

            {/* Right panel - Active conversation */}
            {selectedConversation ? (
                <div className="flex-1 flex flex-col border-l border-border">
                    {/* Conversation header */}
                    <div className="h-16 px-6 border-b border-border bg-card flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage
                                src=""
                                alt={selectedConversation.participants[0].name}
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {selectedConversation.participants[0].avatar}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-semibold">
                                {selectedConversation.participants[0].name}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {selectedConversation.participants[0].address}
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 bg-background">
                        {conversationMessages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))}
                    </div>

                    {/* Message input */}
                    <MessageInput onSend={handleSendMessage} />
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

