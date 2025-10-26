"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Community } from "@/lib/mock-data";
import { Users, Lock, Coins, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityCardProps {
  community: Community;
  onJoin: (id: string) => void;
}

export function CommunityCard({ community, onJoin }: CommunityCardProps) {
  return (
    <div className="bg-card border border-border p-6 hover:border-primary transition-colors">
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src="" alt={community.name} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {community.avatar}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-lg">{community.name}</h3>
            {community.type === "paid" && (
              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            {community.type === "token-gated" && (
              <Coins className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {community.description}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
            <Users className="h-3 w-3" />
            <span>Members</span>
          </div>
          <p className="font-semibold">{community.memberCount.toLocaleString()}</p>
        </div>
        {community.pnl && (
          <div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
              {community.pnl.positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>P&L</span>
            </div>
            <p
              className={cn(
                "font-semibold",
                community.pnl.positive ? "text-primary" : "text-destructive"
              )}
            >
              {community.pnl.percentage}
            </p>
          </div>
        )}
      </div>

      {/* Owner */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src="" alt={community.owner.name} />
            <AvatarFallback className="bg-muted text-xs">
              {community.owner.avatar}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            by {community.owner.name}
          </span>
        </div>
        {community.type !== "free" && (
          <span className="text-xs font-medium text-primary">
            {community.type === "paid"
              ? community.price
              : `${community.tokenRequired?.amount} ${community.tokenRequired?.symbol}`}
          </span>
        )}
      </div>

      {/* Join button */}
      <Button
        onClick={() => onJoin(community.id)}
        className="w-full"
        variant={community.type === "free" ? "outline" : "default"}
      >
        {community.type === "free"
          ? "Join Free"
          : community.type === "paid"
          ? "Subscribe"
          : "Join with Token"}
      </Button>
    </div>
  );
}

