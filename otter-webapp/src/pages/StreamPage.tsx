import { useState, useEffect } from "react";
import { Search, RefreshCw, Filter, Clock, Activity, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ActivityList } from "@/components/stream/activity-list";
import { useTransactionPolling } from "@/hooks/use-transaction-polling";
import { getRandomAddress } from "@/lib/api/randomAddress";

export default function StreamPage() {
    const [address, setAddress] = useState("");
    const [isLoadingRandomAddress, setIsLoadingRandomAddress] = useState(true);
    const [filter, setFilter] = useState<'all' | 'transfers' | 'swaps' | 'nfts' | 'calls'>('all');
    const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week' | 'all'>('all');
    const [isPollingEnabled] = useState(true);

    // Fetch a random address on component mount
    useEffect(() => {
        const fetchRandomAddress = async () => {
            try {
                const result = await getRandomAddress();
                if (result) {
                    setAddress(result.address);
                } else {
                    // Fallback to a known active address
                    setAddress("0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809");
                }
            } catch (error) {
                console.error("Error fetching random address:", error);
                // Fallback to a known active address
                setAddress("0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809");
            } finally {
                setIsLoadingRandomAddress(false);
            }
        };

        fetchRandomAddress();
    }, []);

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
        if (address && address.length > 0 && !isLoadingRandomAddress) {
            refresh();
        }
    }, [address, isLoadingRandomAddress, refresh]);

    // Deduplicate activities by digest and filter based on selected filter
    const uniqueActivities = activities.reduce((acc, activity) => {
        if (!acc.find(item => item.digest === activity.digest)) {
            acc.push(activity);
        }
        return acc;
    }, [] as typeof activities);

    const filteredActivities = uniqueActivities.filter(activity => {
        switch (filter) {
            case 'transfers':
                return activity.type === 'incoming' || activity.type === 'outgoing';
            case 'swaps':
                // This would need to be enhanced with protocol detection
                return activity.operationsCount > 1;
            case 'nfts':
                // This would need to be enhanced with NFT detection
                return activity.operationsCount === 1;
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
        // This could open a detailed transaction view
        console.log('View details for:', digest);
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <h1 className="text-3xl font-bold text-foreground">
                        Activity Stream
                    </h1>
                    {isPolling && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Live
                        </Badge>
                    )}
                </div>
                <p className="text-muted-foreground">
                    Monitor real-time blockchain activity for any Sui address with AI-powered explanations.
                </p>
            </div>

            {/* Controls */}
            <div className="space-y-4 mb-6">
                {/* Address Input */}
                <form onSubmit={handleAddressSubmit} className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Enter Sui address (0x...)"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button type="submit" disabled={!address.trim() || isLoading}>
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
                            disabled={isLoading}
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
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="px-3 py-1 border border-border rounded-md bg-background text-sm"
                        >
                            <option value="all">All Activity</option>
                            <option value="transfers">Transfers</option>
                            <option value="swaps">Swaps</option>
                            <option value="nfts">NFTs</option>
                            <option value="calls">Smart Contracts</option>
                        </select>
                    </div>

                    {/* Time Range */}
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as any)}
                            className="px-3 py-1 border border-border rounded-md bg-background text-sm"
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
            <div className="mb-6">
                {isLoadingRandomAddress && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Finding a random active address...
                    </div>
                )}
                {isLoading && activities.length === 0 && !isLoadingRandomAddress && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading activities...
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {activities.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                        Showing {filteredActivities.length} of {activities.length} activities
                        {filter !== 'all' && ` (filtered by ${filter})`}
                    </div>
                )}
            </div>

            {/* Activity List */}
            <ActivityList
                activities={filteredActivities}
                isLoading={isLoading}
                error={error}
                hasMore={hasMore}
                onRefresh={handleRefresh}
                onLoadMore={loadMore}
                onViewDetails={handleViewDetails}
            />

            {/* Footer Info */}
            <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
                <p>
                    Data updates every 30 seconds •
                    <Button variant="link" className="p-0 h-auto text-sm" onClick={() => window.open('https://suiexplorer.com', '_blank')}>
                        View on SuiScan
                    </Button>
                </p>
            </div>
        </div>
    );
}
