import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GroupGallery } from "@/components/groups/group-gallery";
import { CreateGroup } from "@/components/groups/create-group";
import { MemberSidebar } from "@/components/groups/member-sidebar";
import { MessageInput } from "@/components/messages/message-input";
import { MessageWithMedia } from "@/components/messages/message-with-media";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClickableAvatar } from "@/components/ui/clickable-avatar";
import { Button } from "@/components/ui/button";
import { ZeroBackground } from "@/components/ui/zero-background";
import { useQueryClient } from "@tanstack/react-query";
import { useGroupChat, useSendGroupMessage, useGroupMessages } from "@/hooks/useGroupMessaging";
import { useUserGroups, useCommunityMembers } from "@/hooks/useUserGroups";
import { useUsername } from "@/hooks/useUsernameRegistry";
import { getDisplayName } from "@/contexts/UserProfileContext";
import { Users as UsersIcon, ArrowLeft, Loader2 } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";

type GroupsView = 'gallery' | 'create' | 'chat';

export default function GroupsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const currentAccount = useCurrentAccount();
    const [currentView, setCurrentView] = useState<GroupsView>('gallery');
    const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
    const [showMembers, setShowMembers] = useState(true);

    // Get user's groups for the group list
    const { data: userGroups = [] } = useUserGroups();

    // Get group chat data for the selected group
    const {
        data: groupChatData,
        isLoading: isLoadingChat,
        error: chatError
    } = useGroupChat(selectedGroupId || '');

    // Get messages for the selected group
    const {
        data: messages = [],
        isLoading: isLoadingMessages,
        error: messagesError
    } = useGroupMessages(selectedGroupId || '');

    // Debug logging
    console.log('GroupsPage state:', {
        currentView,
        selectedGroupId,
        isLoadingChat,
        chatError: chatError?.message,
        hasGroupChatData: !!groupChatData,
        messagesCount: messages.length,
        isLoadingMessages
    });

    // Get community members for the selected group
    const { data: communityMembers = [] } = useCommunityMembers(selectedGroupId || '');

    // Send message mutation
    const sendMessageMutation = useSendGroupMessage();

    const handleSendMessage = async (content: string) => {
        if (!selectedGroupId || !groupChatData?.membershipNftId) {
            console.error('Missing group ID or membership NFT');
            return;
        }

        try {
            await sendMessageMutation.mutateAsync({
                communityId: selectedGroupId,
                membershipNftId: groupChatData.membershipNftId,
                content,
            });
            // The mutation will automatically invalidate the queries
        } catch (error) {
            console.error('Failed to send message:', error);
        }
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
        console.log('Selecting group:', groupId);
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
            <div className="page-container">
                <div className="page-header">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={handleBackToGallery}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Groups
                        </Button>
                        <div>
                            <h1 className="page-heading">Create Group</h1>
                            <p className="page-subtitle">Start a new community and invite others to join</p>
                        </div>
                    </div>
                </div>
                <CreateGroup
                    onCreated={handleGroupCreated}
                    onCancel={handleBackToGallery}
                />
            </div>
        );
    }

    if (currentView === 'chat' && selectedGroupId) {
        // Show loading state while fetching group chat data
        if (isLoadingChat) {
            return (
                <div className="flex h-full">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="loading-content">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                            <p className="muted-text">Loading group chat...</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Show error state
        if (chatError) {
            return (
                <div className="flex h-full">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="error-content">
                            <p className="text-destructive">Failed to load group chat</p>
                            <Button onClick={handleBackToGallery}>Back to Groups</Button>
                        </div>
                    </div>
                </div>
            );
        }

        // Show chat interface
        if (groupChatData) {
            return (
                <div className="flex h-full">
                    {/* Left panel - Group list */}
                    <div className="w-80 border-r border-border bg-card">
                        <div className="h-18 p-4 border-b border-border flex items-center">
                            <Button
                                variant="ghost"
                                onClick={handleBackToGallery}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Groups
                            </Button>
                        </div>
                        {/* Convert user groups to the format expected by GroupList */}
                        <div className="p-4 space-y-2">
                            {userGroups.map((group) => (
                                <div
                                    key={group.id}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedGroupId === group.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                        }`}
                                    onClick={() => setSelectedGroupId(group.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {group.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="card-heading truncate">{group.name}</p>
                                            <p className="small-text opacity-70">
                                                {group.currentMembers}/{group.maxMembers} members
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Middle panel - Active group chat */}
                    <div className="flex-1 flex flex-col">
                        {/* Group header */}
                        <div className="h-18 px-6 border-b border-border bg-card flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {groupChatData.community.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="section-heading">{groupChatData.community.name}</h2>
                                    <p className="muted-text">
                                        {groupChatData.community.memberCount} members
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
                        <div className="flex-1 overflow-y-auto p-6 bg-background relative">
                            <ZeroBackground />
                            <div
                                className="relative z-5"
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
                                {isLoadingMessages ? (
                                    <div className="loading-state">
                                        <div className="loading-content">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                            <p className="muted-text">Loading messages...</p>
                                        </div>
                                    </div>
                                ) : messagesError ? (
                                    <div className="error-state">
                                        <div className="error-content">
                                            <p className="text-destructive">Failed to load messages</p>
                                            <Button onClick={() => window.location.reload()}>Retry</Button>
                                        </div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="text-center text-muted-foreground">
                                            <p className="section-heading">No messages yet</p>
                                            <p className="muted-text">Be the first to send a message!</p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((message) => {
                                        const isOwnMessage = message.sender.toLowerCase() === currentAccount?.address.toLowerCase();
                                        return (
                                            <GroupMessageItem
                                                key={message.id}
                                                message={message}
                                                isOwnMessage={isOwnMessage}
                                                groupName={groupChatData?.community.name || "Group"}
                                            />
                                        );
                                    })
                                )}
                            </div>
                        </div>


                        {/* Message input */}
                        {groupChatData.membershipNftId && (
                            <MessageInput
                                onSend={handleSendMessage}
                                disabled={sendMessageMutation.isPending}
                            />
                        )}
                    </div>

                    {/* Right panel - Member sidebar */}
                    <MemberSidebar
                        members={communityMembers}
                        isOpen={showMembers}
                    />
                </div>
            );
        } else {
            // Show fallback when groupChatData is null
            return (
                <div className="flex h-full">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="error-content">
                            <p className="muted-text">Unable to load group chat</p>
                            <Button onClick={handleBackToGallery}>Back to Groups</Button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // Default view - Group Gallery
    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-heading">Groups</h1>
                <p className="page-subtitle">Manage your groups and connect with others</p>
            </div>
            <GroupGallery
                onCreateGroup={handleCreateGroup}
                onExploreGroups={handleExploreGroups}
                onSelectGroup={handleSelectGroup}
            />
        </div>
    );
}

// Group Message Item Component
interface GroupMessageItemProps {
    message: {
        id: string;
        communityId: string;
        sender: string;
        content: string;
        mediaRef: string;
        timestamp: number;
    };
    isOwnMessage: boolean;
    groupName: string;
}

function GroupMessageItem({ message, isOwnMessage, groupName }: GroupMessageItemProps) {
    const { data: username } = useUsername(message.sender);
    const displayName = username || getDisplayName(message.sender);
    const avatarFallback = username ? username.slice(0, 2).toUpperCase() : getDisplayName(message.sender).slice(0, 2).toUpperCase();

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`mb-4 ${isOwnMessage ? 'flex justify-end' : 'flex justify-start'} relative z-10`}>
            <div className={`flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''} max-w-[70%] relative z-10`}>
                {/* Avatar for other users */}
                {!isOwnMessage && (
                    <div className="flex flex-col items-center gap-1">
                        <ClickableAvatar address={message.sender} className="h-8 w-8 flex-shrink-0 relative z-10">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {avatarFallback}
                                </AvatarFallback>
                            </Avatar>
                        </ClickableAvatar>
                        <span className="text-xs text-muted-foreground text-center max-w-[60px] truncate">
                            {displayName}
                        </span>
                    </div>
                )}

                {/* Message content */}
                <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    <div
                        className={`px-4 py-2 rounded-2xl ${isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border'
                            }`}
                        style={{
                            backgroundColor: isOwnMessage
                                ? 'hsl(var(--primary))'
                                : 'hsl(var(--card))'
                        }}
                    >
                        <MessageWithMedia
                            content={message.content}
                            isOwn={isOwnMessage}
                            senderName={displayName}
                            groupName={groupName}
                        />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatTimestamp(message.timestamp)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}