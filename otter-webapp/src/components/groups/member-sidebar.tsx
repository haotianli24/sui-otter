
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommunityMember } from "@/hooks/useUserGroups";
import { Users as UsersIcon } from "lucide-react";
import { useUsername } from "@/hooks/useUsernameRegistry";

interface MemberSidebarProps {
  members: CommunityMember[];
  isOpen: boolean;
}

// Component to display member with username lookup
function MemberItem({ member }: { member: CommunityMember }) {
  const { data: username, isLoading: isLoadingUsername } = useUsername(member.address);
  
  // Use username if available, otherwise use a better fallback
  const displayName = username || `User ${member.address.slice(0, 8)}`;
  const fallbackText = username ? username.slice(0, 2).toUpperCase() : member.address.slice(0, 2).toUpperCase();
  
  return (
    <div className="p-3 hover:bg-accent transition-colors flex items-center gap-3">
      <Avatar className="h-9 w-9">
        <AvatarImage src="" alt={displayName} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {fallbackText}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {isLoadingUsername ? (
            <span className="text-muted-foreground">Loading...</span>
          ) : (
            displayName
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {member.address.slice(0, 6)}...{member.address.slice(-4)}
        </p>
      </div>
    </div>
  );
}

export function MemberSidebar({ members, isOpen }: MemberSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="w-64 border-l border-border bg-card flex flex-col">
      <div className="h-18 p-4 border-b border-border flex items-center">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5" />
          <h3 className="font-semibold">Members ({members.length})</h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {members.map((member) => (
          <MemberItem key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}

