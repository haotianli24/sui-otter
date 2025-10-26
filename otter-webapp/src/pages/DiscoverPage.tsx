import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Search, Loader2, RefreshCw } from "lucide-react";
import { useAllGroups } from "@/hooks/useUserGroups";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

export default function DiscoverPage() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute, isPending: isJoining } = useSignAndExecuteTransaction();
  const { data: groups = [], isLoading, error, refetch } = useAllGroups();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "free" | "paid">("all");

  // Filter groups based on search and type
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || group.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleJoinGroup = async (groupId: string, isPaid: boolean, price?: number) => {
    if (!currentAccount) {
      alert("Please connect your wallet to join a group");
      return;
    }

    try {
      const tx = new Transaction();

      // Registry object ID for the group contract
      const registryId = '0x7ece486d159e8b2a8d723552b218ef99a21d3555b199173d2dd49ce2d13b14eb';

      if (isPaid && price) {
        // For paid groups, we need to provide a coin with the entry fee
        // This is a simplified version - in production you'd need to handle coin selection
        tx.moveCall({
          package: '0xbe3df18a07f298aa3bbfb58c611595ea201fa320408fb546700d3733eae862c8',
          module: 'community',
          function: 'join_community',
          arguments: [
            tx.object(registryId),
            tx.object(groupId),
            tx.splitCoins(tx.gas, [tx.pure.u64(Math.floor(price * 1_000_000_000))]), // Convert SUI to MIST
          ],
        });
      } else {
        // For free groups, we can provide a zero-value coin
        tx.moveCall({
          package: '0xbe3df18a07f298aa3bbfb58c611595ea201fa320408fb546700d3733eae862c8',
          module: 'community',
          function: 'join_community',
          arguments: [
            tx.object(registryId),
            tx.object(groupId),
            tx.splitCoins(tx.gas, [tx.pure.u64(0)]), // Zero-value coin for free groups
          ],
        });
      }

      await signAndExecute({ transaction: tx });

      // Refresh groups list
      refetch();
      alert("Successfully joined the group!");
    } catch (error) {
      console.error("Failed to join group:", error);
      alert("Failed to join group. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="muted-text">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to load groups</p>
          <Button onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-heading">Discover</h1>
        <p className="page-subtitle">Explore groups and connect with others</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
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


      {/* Groups */}
      <div className="space-y-4">
        <h2 className="section-heading flex items-center gap-2">
          <Users className="h-5 w-5" />
          Groups ({filteredGroups.length})
        </h2>
        {filteredGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No groups found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="border border-border bg-card hover:bg-accent transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {group.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="card-heading">{group.name}</CardTitle>
                          <Badge variant={group.type === "paid" ? "secondary" : "outline"}>
                            {group.type === "paid" ? `${group.price?.toFixed(2) || '0.00'} SUI` : "Free"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="muted-text">{group.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1 muted-text">
                      <Users className="h-4 w-4" />
                      <span>{group.currentMembers}/{group.maxMembers} members</span>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleJoinGroup(group.id, group.type === "paid", group.price)}
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
              <p className="text-sm text-muted-foreground">Total Groups</p>
              <p className="text-2xl font-bold">{groups.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Free Groups</p>
              <p className="text-2xl font-bold">{groups.filter(c => c.type === "free").length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Paid Groups</p>
              <p className="text-2xl font-bold">{groups.filter(c => c.type === "paid").length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold">{groups.reduce((sum, c) => sum + c.currentMembers, 0).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
