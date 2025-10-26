import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Users, Hash } from "lucide-react";

export default function DiscoverPage() {
  const [categories] = useState([
    { id: 1, name: "Crypto Trading", color: "bg-blue-500" },
    { id: 2, name: "NFTs", color: "bg-purple-500" },
    { id: 3, name: "DeFi", color: "bg-green-500" },
    { id: 4, name: "Gaming", color: "bg-pink-500" },
    { id: 5, name: "Web3", color: "bg-indigo-500" },
    { id: 6, name: "Community", color: "bg-orange-500" },
  ]);

  const [trendingChannels] = useState([
    {
      id: 1,
      name: "sui-traders",
      description: "Discuss Sui blockchain trading strategies and market analysis",
      members: 1250,
      trending: true,
      icon: "📈",
    },
    {
      id: 2,
      name: "nft-showcase",
      description: "Share and discover amazing NFT collections",
      members: 890,
      trending: true,
      icon: "🎨",
    },
    {
      id: 3,
      name: "defi-protocols",
      description: "Discuss DeFi protocols, yield farming, and liquidity pools",
      members: 756,
      trending: false,
      icon: "💰",
    },
    {
      id: 4,
      name: "gaming-lounge",
      description: "Web3 gaming discussions and game launches",
      members: 642,
      trending: false,
      icon: "🎮",
    },
    {
      id: 5,
      name: "dev-talk",
      description: "Developers discussing Sui development and smart contracts",
      members: 534,
      trending: true,
      icon: "💻",
    },
    {
      id: 6,
      name: "general-chat",
      description: "General discussion and community hangout",
      members: 2100,
      trending: false,
      icon: "💬",
    },
  ]);

  const [communities] = useState([
    {
      id: 1,
      name: "Sui Community",
      description: "The official Sui blockchain community",
      members: 25000,
      verified: true,
      icon: "🌊",
    },
    {
      id: 2,
      name: "Move Developers",
      description: "For developers building with Move language",
      members: 5600,
      verified: true,
      icon: "🔧",
    },
    {
      id: 3,
      name: "Traders Hub",
      description: "Connect with traders and investors",
      members: 8900,
      verified: false,
      icon: "📊",
    },
    {
      id: 4,
      name: "NFT Collectors",
      description: "Discuss and trade digital collectibles",
      members: 4200,
      verified: false,
      icon: "🖼️",
    },
  ]);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Discover</h1>
        </div>
        <p className="text-muted-foreground">Explore channels, communities, and connect with others</p>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              className="h-auto flex-col items-center justify-center py-4 hover:bg-primary/10"
            >
              <span className="text-2xl mb-2">📁</span>
              <span className="text-sm text-center">{category.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Trending Channels */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Channels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingChannels.map((channel) => (
            <Card key={channel.id} className="border border-border bg-card hover:bg-accent transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{channel.icon}</span>
                    <div>
                      <CardTitle className="text-lg">#{channel.name}</CardTitle>
                      {channel.trending && (
                        <Badge className="mt-1" variant="default">
                          Trending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{channel.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{channel.members.toLocaleString()} members</span>
                  </div>
                  <Button size="sm" variant="outline">
                    Join
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Featured Communities */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Featured Communities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {communities.map((community) => (
            <Card key={community.id} className="border border-border bg-card hover:bg-accent transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">{community.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{community.name}</CardTitle>
                        {community.verified && (
                          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                            ✓ Verified
                          </Badge>
                        )}
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
                    <span>{community.members.toLocaleString()} members</span>
                  </div>
                  <Button size="sm" variant="default">
                    Join
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Platform Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active Channels</p>
              <p className="text-2xl font-bold">1,234</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Communities</p>
              <p className="text-2xl font-bold">156</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold">45.2K</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Messages Today</p>
              <p className="text-2xl font-bold">12.5K</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
