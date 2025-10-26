import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Search, RefreshCw } from "lucide-react";
import { useUserGroups } from "@/hooks/useUserGroups";

interface GroupGalleryProps {
  onCreateGroup: () => void;
  onExploreGroups: () => void;
  onSelectGroup: (groupId: string) => void;
}

export function GroupGallery({ onCreateGroup, onExploreGroups, onSelectGroup }: GroupGalleryProps) {
  const { 
    data: groups = [], 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useUserGroups();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error.message || "Failed to load groups"}</p>
          <Button onClick={() => refetch()} disabled={isRefetching}>
            {isRefetching ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              "Retry"
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Users className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">No Groups Yet</h3>
            <p className="text-muted-foreground">You haven't joined any groups yet. Create your own community or explore existing ones.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={onCreateGroup} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
            <Button variant="outline" onClick={onExploreGroups} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Explore Groups
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Groups ({groups.length})</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetch()} 
            size="sm" 
            variant="outline"
            disabled={isRefetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={onCreateGroup} size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create
          </Button>
          <Button variant="outline" onClick={onExploreGroups} size="sm" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Explore
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card 
            key={group.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectGroup(group.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={group.avatar} alt={group.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {group.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{group.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={group.type === 'free' ? 'secondary' : 'default'}>
                      {group.type === 'free' ? 'Free' : `${group.price} SUI`}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {group.currentMembers}/{group.maxMembers} members
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {group.description}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </span>
                <Button size="sm" variant="ghost">
                  Open Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
