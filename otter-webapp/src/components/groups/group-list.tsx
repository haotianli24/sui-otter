

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Conversation } from "@/lib/mock-data";
import { formatDistanceToNow } from "@/lib/format-date";
import { Users as UsersIcon } from "lucide-react";

interface GroupListProps {
  groups: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function GroupList({ groups, selectedId, onSelect }: GroupListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Groups</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => {
          const isSelected = group.id === selectedId;

          return (
            <button
              key={group.id}
              onClick={() => onSelect(group.id)}
              className={cn(
                "w-full p-4 flex items-start gap-3 hover:bg-accent transition-colors border-b border-border",
                isSelected && "bg-accent"
              )}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src="" alt={group.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {group.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">
                    {group.name}
                  </h3>
                  {/* Could add lock icon for paid groups here */}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <UsersIcon className="h-3 w-3" />
                  <span>{group.participants.length} members</span>
                </div>
                {group.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {group.lastMessage.type === "text"
                      ? group.lastMessage.content
                      : group.lastMessage.type === "trade"
                      ? "📊 Trade shared"
                      : "💰 Crypto sent"}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {group.lastMessage && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(group.lastMessage.timestamp)}
                  </span>
                )}
                {group.unreadCount > 0 && (
                  <div className="h-5 min-w-[20px] px-1.5 bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                    {group.unreadCount}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

