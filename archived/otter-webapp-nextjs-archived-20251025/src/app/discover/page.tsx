"use client";

import { useState } from "react";
import { CommunityCard } from "@/components/groups/community-card";
import { mockCommunities } from "@/lib/mock-data";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "free" | "paid" | "token-gated">(
    "all"
  );

  const filteredCommunities = mockCommunities.filter((community) => {
    const matchesSearch =
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filter === "all" || community.type === filter;

    return matchesSearch && matchesFilter;
  });

  const handleJoinCommunity = (id: string) => {
    // Mock join action
    console.log("Joining community:", id);
    alert("Join functionality will be connected to backend");
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover Communities</h1>
          <p className="text-muted-foreground">
            Find and join trading communities that match your interests
          </p>
        </div>

        {/* Search and filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === "free" ? "default" : "outline"}
              onClick={() => setFilter("free")}
              size="sm"
            >
              Free
            </Button>
            <Button
              variant={filter === "paid" ? "default" : "outline"}
              onClick={() => setFilter("paid")}
              size="sm"
            >
              Paid
            </Button>
            <Button
              variant={filter === "token-gated" ? "default" : "outline"}
              onClick={() => setFilter("token-gated")}
              size="sm"
            >
              Token Gated
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {filteredCommunities.length} communities found
        </div>

        {/* Community grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              onJoin={handleJoinCommunity}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredCommunities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No communities found matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

