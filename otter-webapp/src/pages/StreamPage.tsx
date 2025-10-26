import { useState, useEffect } from "react";
import { Search, RefreshCw, Activity, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ActivityList } from "@/components/stream/activity-list";
import { useTransactionPolling } from "@/hooks/use-transaction-polling";
import { useCurrentAccount } from "@mysten/dapp-kit";

export default function StreamPage() {
    const [address, setAddress] = useState("");
    const [filter, setFilter] = useState<'all' | 'transfers' | 'swaps' | 'nfts' | 'calls'>('all');
    const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week' | 'all'>('all');
    const [isPollingEnabled] = useState(true);
    const currentAccount = useCurrentAccount();

    // Use connected wallet address
    useEffect(() => {
        if (currentAccount?.address) {
            setAddress(currentAccount.address);
        } else {
            setAddress("");
        }
    }, [currentAccount?.address]);

    const {
        activities,
        isLoading,
        error,
        refresh,
        newCount,
        hasMore,
        loadMore,
        isPolling
    } = useTransactionPolling({
        address,
        enabled: isPollingEnabled && address.length > 0
    });

    // Trigger refresh when address is loaded
    useEffect(() => {
        if (address && address.length > 0) {
            refresh();
        }
    }, [address, refresh]);

    // Deduplicate activities by digest and filter based on selected filter
    const uniqueActivities = activities.reduce((acc, activity) => {
        if (!acc.find(item => item.digest === activity.digest)) {
            acc.push(activity);
        }
        return acc;
    }, [] as typeof activities);

    // Filter by time range first
    const timeFilteredActivities = uniqueActivities.filter(activity => {
        if (timeRange === 'all') return true;

        const activityTime = new Date(parseInt(activity.timestamp));
        const now = new Date();
        const timeDiff = now.getTime() - activityTime.getTime();

        switch (timeRange) {
            case 'hour':
                return timeDiff <= 60 * 60 * 1000; // 1 hour in milliseconds
            case 'day':
                return timeDiff <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            case 'week':
                return timeDiff <= 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            default:
                return true;
        }
    });

    // Then filter by activity type
    const filteredActivities = timeFilteredActivities.filter(activity => {
        switch (filter) {
            case 'transfers':
                return activity.type === 'incoming' || activity.type === 'outgoing';
            case 'swaps':
                // Look for swap-like patterns: multiple operations with different types
                // or operations that suggest token exchanges
                return activity.operationsCount > 1 && (
                    activity.operationsCount >= 2 || // Multiple operations often indicate swaps
                    activity.gasUsed > '1000000' // Higher gas usage often indicates complex operations like swaps
                );
            case 'nfts':
                // Look for NFT-like patterns: single operations with specific characteristics
                return activity.operationsCount === 1 && activity.gasUsed < '500000';
            case 'calls':
                return activity.operationsCount > 0;
            default:
                return true;
        }
    });

    const handleAddressSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (address.trim()) {
            refresh();
        }
    };

    const handleRefresh = () => {
        refresh();
    };

    const handleViewDetails = (digest: string) => {
        console.log('View details for:', digest);
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div className="flex items-center gap-3">
                    <h1 className="page-heading">Activity Stream</h1>
                    {isPolling && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Live
                        </Badge>
                    )}
                </div>
                <p className="page-subtitle">
                    Monitor real-time blockchain activity for any Sui address with AI-powered explanations.
                </p>
            </div>

            {/* Controls */}
            <div className="section-container">
                {/* Address Input */}
                <form onSubmit={handleAddressSubmit} className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 muted-text" />
                        <Input
                            type="text"
                            placeholder={currentAccount ? "Connected wallet address" : "Connect wallet to view activity"}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="pl-10"
                            disabled={!currentAccount}
                        />
                    </div>
                    <Button type="submit" disabled={!address.trim() || isLoading || !currentAccount}>
                        <Search className="h-4 w-4 mr-2" />
                        Monitor
                    </Button>
                </form>

                {/* Controls Row */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Refresh Control */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isLoading || !currentAccount}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>

                    {/* New Activity Badge */}
                    {newCount > 0 && (
                        <Badge variant="default" className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {newCount} new
                        </Badge>
                    )}

                    {/* Filter Dropdown */}
                    <div className="flex items-center gap-2">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="h-9 pl-5 pr-6 py-1 border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-no-repeat bg-right bg-[length:14px] bg-[position:right_8px_center] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAxNCAxNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMuNSA1TDUuNSA3TDcuNSA1IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')]"
                        >
                            <option value="all">All Activity</option>
                            <option value="transfers">Transfers</option>
                            <option value="swaps">Swaps</option>
                            <option value="nfts">NFTs</option>
                            <option value="calls">Smart Contracts</option>
                        </select>
                    </div>

                    {/* Time Range Dropdown */}
                    <div className="flex items-center gap-2">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as any)}
                            className="h-9 pl-5 pr-6 py-1 border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-no-repeat bg-right bg-[length:14px] bg-[position:right_8px_center] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAxNCAxNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMuNSA1TDUuNSA3TDcuNSA1IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')]"
                        >
                            <option value="all">All Time</option>
                            <option value="hour">Last Hour</option>
                            <option value="day">Last 24h</option>
                            <option value="week">Last 7 days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Status Indicators */}
            <div className="section-container">
                {!currentAccount && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        Please connect your wallet to view activity stream
                    </div>
                )}


                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {activities.length > 0 && (
                    <div className="muted-text">
                        Showing {filteredActivities.length} of {activities.length} activities
                        {filter !== 'all' && ` (filtered by ${filter})`}
                        {timeRange !== 'all' && ` (${timeRange} time range)`}
                    </div>
                )}
            </div>

            {/* Activity List */}
            {currentAccount ? (
                <ActivityList
                    activities={filteredActivities}
                    isLoading={isLoading}
                    error={error}
                    hasMore={hasMore}
                    onRefresh={handleRefresh}
                    onLoadMore={loadMore}
                    onViewDetails={handleViewDetails}
                    currentUserAddress={currentAccount?.address}
                />
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                    <p className="text-muted-foreground mb-4">
                        Connect your Sui wallet to view your transaction activity and monitor real-time blockchain events.
                    </p>
                </div>
            )}

            {/* Footer Info */}
            <div className="mt-8 pt-6 border-t border-border text-center muted-text">
                <p>
                    Data updates every 30 seconds •
                    <Button variant="link" className="p-0 h-auto text-sm ml-2" onClick={() => window.open('https://suiexplorer.com', '_blank')}>
                        View on SuiScan
                        <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                </p>
            </div>
        </div>
    );
}
