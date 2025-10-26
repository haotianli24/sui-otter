import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Users, Search, Loader2, RefreshCw } from "lucide-react";
import { useAllCommunities } from "@/hooks/useUserGroups";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

export default function DiscoverPage() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute, isPending: isJoining } = useSignAndExecuteTransaction();
  const { data: communities = [], isLoading, error, refetch } = useAllCommunities();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "free" | "paid">("all");

  // Filter communities based on search and type
  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || community.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleJoinCommunity = async (communityId: string, isPaid: boolean, price?: number) => {
    if (!currentAccount) {
      alert("Please connect your wallet to join a community");
      return;
    }

    try {
      const tx = new Transaction();
      
      // Registry object ID for the community contract
      const registryId = '0x7ece486d159e8b2a8d723552b218ef99a21d3555b199173d2dd49ce2d13b14eb';

      if (isPaid && price) {
        // For paid communities, we need to provide a coin with the entry fee
        // This is a simplified version - in production you'd need to handle coin selection
        tx.moveCall({
          package: '0xbe3df18a07f298aa3bbfb58c611595ea201fa320408fb546700d3733eae862c8',
          module: 'community',
          function: 'join_community',
          arguments: [
            tx.object(registryId),
            tx.object(communityId),
            tx.splitCoins(tx.gas, [tx.pure.u64(Math.floor(price * 1_000_000_000))]), // Convert SUI to MIST
          ],
        });
      } else {
        // For free communities, we can provide a zero-value coin
        tx.moveCall({
          package: '0xbe3df18a07f298aa3bbfb58c611595ea201fa320408fb546700d3733eae862c8',
          module: 'community',
          function: 'join_community',
          arguments: [
            tx.object(registryId),
            tx.object(communityId),
            tx.splitCoins(tx.gas, [tx.pure.u64(0)]), // Zero-value coin for free communities
          ],
        });
      }

      await signAndExecute({ transaction: tx });
      
      // Refresh communities list
      refetch();
      alert("Successfully joined the community!");
    } catch (error) {
      console.error("Failed to join community:", error);
      alert("Failed to join community. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading communities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to load communities</p>
          <Button onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Discover</h1>
        </div>
        <p className="text-muted-foreground">Explore communities and connect with others</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
          >
            All
          </Button>
          <Button
            variant={filterType === "free" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("free")}
          >
            Free
          </Button>
          <Button
            variant={filterType === "paid" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("paid")}
          >
            Paid
          </Button>
        </div>
      </div>


      {/* Communities */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Communities ({filteredCommunities.length})
        </h2>
        {filteredCommunities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No communities found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommunities.map((community) => (
              <Card key={community.id} className="border border-border bg-card hover:bg-accent transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {community.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{community.name}</CardTitle>
                          <Badge variant={community.type === "paid" ? "secondary" : "outline"}>
                            {community.type === "paid" ? `${community.price?.toFixed(2) || '0.00'} SUI` : "Free"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{community.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{community.currentMembers}/{community.maxMembers} members</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => handleJoinCommunity(community.id, community.type === "paid", community.price)}
                      disabled={isJoining}
                    >
                      {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Platform Stats */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Platform Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Communities</p>
              <p className="text-2xl font-bold">{communities.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Free Communities</p>
              <p className="text-2xl font-bold">{communities.filter(c => c.type === "free").length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Paid Communities</p>
              <p className="text-2xl font-bold">{communities.filter(c => c.type === "paid").length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold">{communities.reduce((sum, c) => sum + c.currentMembers, 0).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
