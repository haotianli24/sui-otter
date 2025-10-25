'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Users, Star, Filter, Grid, List, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useRouter } from 'next/navigation';
import HomeClient from '../components/HomeClient';

// Mock data for communities and profiles
const mockCommunities = [
  {
    id: 1,
    name: "Crypto Whales",
    description: "High-volume traders sharing alpha calls and market insights",
    owner: "WhaleMaster",
    members: 1247,
    profit: "+$2.4M",
    profitPercent: "+127%",
    verified: true,
    tags: ["DeFi", "Trading", "Alpha"],
    avatar: "🐋"
  },
  {
    id: 2,
    name: "Sui Network",
    description: "Official Sui blockchain community for developers and traders",
    owner: "Sui Foundation",
    members: 850,
    profit: "+$1.8M",
    profitPercent: "+89%",
    verified: true,
    tags: ["Sui", "Blockchain", "Official"],
    avatar: "🔗"
  },
  {
    id: 3,
    name: "DeFi Traders",
    description: "Decentralized finance trading strategies and yield farming",
    owner: "DeFiGuru",
    members: 2300,
    profit: "+$3.2M",
    profitPercent: "+156%",
    verified: false,
    tags: ["DeFi", "Yield", "Farming"],
    avatar: "🌾"
  }
];

const mockProfiles = [
  {
    id: 1,
    name: "CryptoTrader",
    username: "@cryptotrader",
    description: "Professional trader with 5+ years experience in DeFi",
    followers: 15420,
    profit: "+$450K",
    profitPercent: "+78%",
    verified: true,
    tags: ["Professional", "DeFi", "Analyst"],
    avatar: "👨‍💼"
  },
  {
    id: 2,
    name: "SuiMaximalist",
    username: "@suimax",
    description: "Sui ecosystem enthusiast and early adopter",
    followers: 8900,
    profit: "+$320K",
    profitPercent: "+145%",
    verified: true,
    tags: ["Sui", "Early Adopter", "Ecosystem"],
    avatar: "🚀"
  },
  {
    id: 3,
    name: "YieldFarmer",
    username: "@yieldfarmer",
    description: "Yield farming strategies and liquidity provision",
    followers: 12300,
    profit: "+$280K",
    profitPercent: "+92%",
    verified: false,
    tags: ["Yield", "Farming", "Liquidity"],
    avatar: "🌱"
  }
];

const Explore = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('communities');

  const filteredCommunities = mockCommunities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredProfiles = mockProfiles.filter(profile =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div 
            className="font-playfair text-2xl font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={() => router.push('/')}
          >
            Otter
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>Messages</Button>
            <Button variant="default">Explore</Button>
            <Button variant="ghost" onClick={() => router.push('/portfolio')}>Portfolio</Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <HomeClient />
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="border-b border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Explore</h1>
              <p className="text-muted-foreground">Discover communities and traders</p>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search communities, profiles, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
          </TabsList>

          {/* Communities Tab */}
          <TabsContent value="communities" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Trading Communities</h2>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {filteredCommunities.map((community) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{community.avatar}</div>
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {community.name}
                              {community.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>by {community.owner}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {community.description}
                      </p>
                      
                      <div className="space-y-3">
                        {/* Stats */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{community.members.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-green-500">
                                {community.profit}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            {community.profitPercent}
                          </Badge>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {community.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Join Button */}
                        <Button className="w-full">
                          Join Community
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Top Traders</h2>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {filteredProfiles.map((profile) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{profile.avatar}</div>
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {profile.name}
                            {profile.verified && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{profile.username}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {profile.description}
                      </p>
                      
                      <div className="space-y-3">
                        {/* Stats */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{profile.followers.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-green-500">
                                {profile.profit}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            {profile.profitPercent}
                          </Badge>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {profile.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Follow Button */}
                        <Button variant="outline" className="w-full">
                          Follow
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Explore;
