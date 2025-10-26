import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GroupGallery } from "@/components/groups/group-gallery";
import { CreateGroup } from "@/components/groups/create-group";
import { MemberSidebar } from "@/components/groups/member-sidebar";
import { MessageInput } from "@/components/messages/message-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useGroupChat, useSendGroupMessage, useGroupMessages } from "@/hooks/useGroupMessaging";
import { useUserGroups, useCommunityMembers } from "@/hooks/useUserGroups";
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

    if (currentView === 'chat' && selectedGroupId) {
        // Show loading state while fetching group chat data
        if (isLoadingChat) {
            return (
                <div className="flex h-full">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                            <p className="text-muted-foreground">Loading group chat...</p>
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
                        <div className="text-center space-y-4">
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
                        {/* Convert user groups to the format expected by GroupList */}
                        <div className="p-4 space-y-2">
                            {userGroups.map((group) => (
                                <div
                                    key={group.id}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                        selectedGroupId === group.id 
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
                                            <p className="font-medium truncate">{group.name}</p>
                                            <p className="text-xs opacity-70">
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
                        <div className="h-28 px-6 border-b border-border bg-card flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {groupChatData.community.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="font-semibold">{groupChatData.community.name}</h2>
                                    <p className="text-xs text-muted-foreground">
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
                        <div className="flex-1 overflow-y-auto p-6 bg-background">
                            {isLoadingMessages ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center space-y-4">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                        <p className="text-muted-foreground">Loading messages...</p>
                                    </div>
                                </div>
                            ) : messagesError ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center space-y-4">
                                        <p className="text-destructive">Failed to load messages</p>
                                        <Button onClick={() => window.location.reload()}>Retry</Button>
                                    </div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center text-muted-foreground">
                                        <p className="text-lg">No messages yet</p>
                                        <p className="text-sm">Be the first to send a message!</p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((message) => {
                                  const isOwnMessage = message.sender.toLowerCase() === currentAccount?.address.toLowerCase();
                                  return (
                                    <div key={message.id} className={`mb-4 ${isOwnMessage ? 'flex justify-end' : 'flex justify-start'}`}>
                                      <div className={`flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''} max-w-[70%]`}>
                                        {!isOwnMessage && (
                                          <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                              {message.sender.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                        <div className={`flex-1 rounded-lg p-3 ${
                                          isOwnMessage 
                                            ? 'bg-primary text-primary-foreground border-2 border-primary/20 shadow-sm ml-auto' 
                                            : 'bg-muted border border-border'
                                        }`}>
                                          {!isOwnMessage && (
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-medium text-xs text-muted-foreground">
                                                {message.sender.substring(0, 8)}...
                                              </span>
                                            </div>
                                          )}
                                          <p className={`text-sm leading-relaxed ${isOwnMessage ? 'text-primary-foreground' : ''}`}>
                                            {message.content}
                                          </p>
                                        </div>
                                        {isOwnMessage && (
                                          <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                              {message.sender.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                            )}
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
                        <div className="text-center space-y-4">
                            <p className="text-muted-foreground">Unable to load group chat</p>
                            <Button onClick={handleBackToGallery}>Back to Groups</Button>
                        </div>
                    </div>
                </div>
            );
        }
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
