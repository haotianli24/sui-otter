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
    refetch,
    isRefetching
  } = useUserGroups();

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-content">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="muted-text">Loading your groups...</p>
        </div>
      </div>
    );
  }


  if (groups.length === 0) {
    return (
      <div className="empty-state">
        <Users className="h-12 w-12 text-muted-foreground mx-auto" />
        <div className="space-y-2">
          <h3 className="section-heading">No Groups Yet</h3>
          <p className="page-subtitle">You haven't joined any groups yet. Create your own group or explore existing ones.</p>
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
    );
  }

  return (
    <div className="section-container">
      <div className="flex items-center justify-between">
        <h2 className="section-heading">Your Groups ({groups.length})</h2>
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
          <Button variant="outline" onClick={onCreateGroup} size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create
          </Button>
          <Button variant="outline" onClick={onExploreGroups} size="sm" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Explore
          </Button>
        </div>
      </div>

      <div className="card-grid">
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
                  <CardTitle className="card-heading truncate">{group.name}</CardTitle>
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
              <p className="muted-text line-clamp-2">
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
