import { useState } from "react";
import { GroupList } from "@/components/groups/group-list";
import { MemberSidebar } from "@/components/groups/member-sidebar";
import { MessageBubble } from "@/components/messages/message-bubble";
import { MessageInput } from "@/components/messages/message-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    mockGroupConversations,
    mockMessages,
    Message,
    currentUser,
} from "@/lib/mock-data";
import { Users as UsersIcon } from "lucide-react";

export default function GroupsPage() {
    const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
        mockGroupConversations[0]?.id
    );
    const [messages, setMessages] = useState(mockMessages);
    const [showMembers, setShowMembers] = useState(true);

    const selectedGroup = mockGroupConversations.find(
        (g) => g.id === selectedGroupId
    );

    const groupMessages = selectedGroupId ? messages[selectedGroupId] || [] : [];

    const handleSendMessage = (content: string) => {
        if (!selectedGroupId) return;

        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            content,
            timestamp: new Date(Date.now()),
            type: "text",
        };

        setMessages((prev) => ({
            ...prev,
            [selectedGroupId]: [...(prev[selectedGroupId] || []), newMessage],
        }));
    };

    return (
        <div className="flex h-full">
            {/* Left panel - Group list */}
            <div className="w-80 border-r border-border bg-card">
                <GroupList
                    groups={mockGroupConversations}
                    selectedId={selectedGroupId}
                    onSelect={setSelectedGroupId}
                />
            </div>

            {/* Middle panel - Active group chat */}
            {selectedGroup ? (
                <>
                    <div className="flex-1 flex flex-col">
                        {/* Group header */}
                        <div className="h-28 px-6 border-b border-border bg-card flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src="" alt={selectedGroup.name} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {selectedGroup.avatar}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="font-semibold">{selectedGroup.name}</h2>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedGroup.participants.length} members
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowMembers(!showMembers)}
                                >
                                    <UsersIcon className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 bg-background">
                            {groupMessages.map((message) => (
                                <MessageBubble key={message.id} message={message} />
                            ))}
                        </div>

                        {/* Message input */}
                        <MessageInput onSend={handleSendMessage} />
                    </div>

                    {/* Right panel - Member sidebar */}
                    <MemberSidebar
                        members={selectedGroup.participants}
                        isOpen={showMembers}
                    />
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-background">
                    <div className="text-center text-muted-foreground">
                        <p className="text-lg">Select a group to start chatting</p>
                    </div>
                </div>
            )}
        </div>
    );
}
