import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GroupGallery } from "@/components/groups/group-gallery";
import { CreateGroup } from "@/components/groups/create-group";
import { GroupList } from "@/components/groups/group-list";
import { MemberSidebar } from "@/components/groups/member-sidebar";
import { MessageBubble } from "@/components/messages/message-bubble";
import { MessageInput } from "@/components/messages/message-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
    mockGroupConversations,
    mockMessages,
    Message,
    currentUser,
} from "@/lib/mock-data";
import { Users as UsersIcon, ArrowLeft } from "lucide-react";

type GroupsView = 'gallery' | 'create' | 'chat';

export default function GroupsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [currentView, setCurrentView] = useState<GroupsView>('gallery');
    const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
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

    const handleCreateGroup = () => {
        setCurrentView('create');
    };

    const handleExploreGroups = () => {
        navigate('/discover');
    };

    const handleGroupCreated = (groupId: string) => {
        console.log("Group created:", groupId);
        // Invalidate and refetch user groups to show the new group
        queryClient.invalidateQueries({ queryKey: ['user-groups'] });
        setCurrentView('gallery');
    };

    const handleSelectGroup = (groupId: string) => {
        setSelectedGroupId(groupId);
        setCurrentView('chat');
    };

    const handleBackToGallery = () => {
        setCurrentView('gallery');
        setSelectedGroupId(undefined);
    };


    // Render different views based on current state
    if (currentView === 'create') {
        return (
            <div className="flex h-full">
                <div className="flex-1 flex items-center justify-center bg-background p-6">
                    <div className="w-full max-w-2xl">
                        <div className="mb-6">
                            <Button 
                                variant="ghost" 
                                onClick={handleBackToGallery}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Groups
                            </Button>
                        </div>
                        <CreateGroup 
                            onCreated={handleGroupCreated}
                            onCancel={handleBackToGallery}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (currentView === 'chat' && selectedGroup) {
        return (
            <div className="flex h-full">
                {/* Left panel - Group list */}
                <div className="w-80 border-r border-border bg-card">
                    <div className="p-4 border-b border-border">
                        <Button 
                            variant="ghost" 
                            onClick={handleBackToGallery}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Groups
                        </Button>
                    </div>
                    <GroupList
                        groups={mockGroupConversations}
                        selectedId={selectedGroupId}
                        onSelect={setSelectedGroupId}
                    />
                </div>

                {/* Middle panel - Active group chat */}
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
            </div>
        );
    }

    // Default view - Group Gallery
    return (
        <div className="flex h-full">
            <div className="flex-1 p-6 bg-background">
                <GroupGallery 
                    onCreateGroup={handleCreateGroup}
                    onExploreGroups={handleExploreGroups}
                    onSelectGroup={handleSelectGroup}
                />
            </div>
        </div>
    );
}
