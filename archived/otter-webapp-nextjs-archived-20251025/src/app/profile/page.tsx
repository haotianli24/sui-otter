"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CreateCommunityModal } from "@/components/groups/create-community-modal";
import { currentUser, mockCommunities } from "@/lib/mock-data";
import { Copy, Wallet, TrendingUp, Users } from "lucide-react";

export default function ProfilePage() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    // Mock portfolio data
    const portfolioData = {
        balance: "1,234.56 SUI",
        balanceUSD: "$2,589.12",
        totalPnL: "+$1,234.56",
        totalPnLPercentage: "+91.2%",
        activeTrades: 5,
        communitiesOwned: 2,
        communitiesJoined: 4,
    };

    // Mock user's communities (owned)
    const ownedCommunities = mockCommunities.filter(
        (c) => c.owner.id === currentUser.id
    );

    // Mock user's subscribed communities
    const subscribedCommunities = mockCommunities.slice(0, 4);

    const copyAddress = () => {
        navigator.clipboard.writeText(currentUser.address);
        alert("Address copied to clipboard!");
    };

    return (
        <div className="h-full overflow-auto bg-background">
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {/* Profile Header */}
                <div className="bg-card border border-border p-8">
                    <div className="flex items-start gap-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src="" alt={currentUser.name} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                                {currentUser.avatar}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-2">{currentUser.name}</h1>
                            <p className="text-muted-foreground mb-3">{currentUser.bio}</p>
                            <div className="flex items-center gap-2">
                                <code className="px-3 py-1 bg-muted text-sm">
                                    {currentUser.address}
                                </code>
                                <Button variant="ghost" size="icon" onClick={copyAddress}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <Button>Edit Profile</Button>
                    </div>
                </div>

                {/* Portfolio Overview */}
                <div className="bg-card border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Wallet className="h-5 w-5" />
                        <h2 className="text-xl font-semibold">Portfolio</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Balance</p>
                            <p className="text-2xl font-bold">{portfolioData.balance}</p>
                            <p className="text-sm text-muted-foreground">
                                {portfolioData.balanceUSD}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Total P&L</p>
                            <p className="text-2xl font-bold text-primary">
                                {portfolioData.totalPnL}
                            </p>
                            <p className="text-sm text-primary">
                                {portfolioData.totalPnLPercentage}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">
                                Active Trades
                            </p>
                            <p className="text-2xl font-bold">{portfolioData.activeTrades}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Communities</p>
                            <p className="text-2xl font-bold">
                                {portfolioData.communitiesOwned + portfolioData.communitiesJoined}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {portfolioData.communitiesOwned} owned,{" "}
                                {portfolioData.communitiesJoined} joined
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border">
                        <Button className="w-full md:w-auto">View Full Portfolio</Button>
                    </div>
                </div>

                {/* Communities Owned */}
                {ownedCommunities.length > 0 && (
                    <div className="bg-card border border-border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                <h2 className="text-xl font-semibold">Communities You Own</h2>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCreateModal(true)}
                            >
                                Create New
                            </Button>
                        </div>
                        <CreateCommunityModal
                            isOpen={showCreateModal}
                            onClose={() => setShowCreateModal(false)}
                        />

                        <div className="space-y-3">
                            {ownedCommunities.map((community) => (
                                <div
                                    key={community.id}
                                    className="flex items-center gap-4 p-4 bg-background border border-border hover:border-primary transition-colors"
                                >
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src="" alt={community.name} />
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {community.avatar}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold">{community.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {community.memberCount} members • {community.type}
                                        </p>
                                    </div>
                                    {community.pnl && (
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-primary">
                                                {community.pnl.percentage}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {community.pnl.value}
                                            </p>
                                        </div>
                                    )}
                                    <Button variant="outline" size="sm">
                                        Manage
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Subscribed Communities */}
                <div className="bg-card border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5" />
                        <h2 className="text-xl font-semibold">Subscribed Communities</h2>
                    </div>

                    <div className="space-y-3">
                        {subscribedCommunities.map((community) => (
                            <div
                                key={community.id}
                                className="flex items-center gap-4 p-4 bg-background border border-border hover:border-primary transition-colors"
                            >
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src="" alt={community.name} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {community.avatar}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold">{community.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        by {community.owner.name}
                                    </p>
                                </div>
                                {community.pnl && (
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-primary">
                                            {community.pnl.percentage}
                                        </p>
                                    </div>
                                )}
                                <Button variant="outline" size="sm">
                                    View
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

