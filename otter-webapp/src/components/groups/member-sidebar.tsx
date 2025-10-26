

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/lib/mock-data";
import { Users as UsersIcon } from "lucide-react";

interface MemberSidebarProps {
  members: User[];
  isOpen: boolean;
}

export function MemberSidebar({ members, isOpen }: MemberSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="w-64 border-l border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5" />
          <h3 className="font-semibold">Members ({members.length})</h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="p-3 hover:bg-accent transition-colors flex items-center gap-3"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src="" alt={member.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {member.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {member.address}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

