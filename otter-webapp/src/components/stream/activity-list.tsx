"use client";

import { useState } from "react";
import { Loader2, AlertCircle, RefreshCw, ChevronDown, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityItem } from "./activity-item";
import { EmptyState } from "@/components/ui/empty-state";

interface ActivityItem {
    digest: string;
    timestamp: string;
    sender: string;
    type: 'incoming' | 'outgoing';
    gasUsed: string;
    operationsCount: number;
    participants: string[];
}

interface ActivityListProps {
    activities: ActivityItem[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    onRefresh: () => void;
    onLoadMore: () => void;
    onViewDetails?: (digest: string) => void;
}

export function ActivityList({
    activities,
    isLoading,
    error,
    hasMore,
    onRefresh,
    onLoadMore,
    onViewDetails
}: ActivityListProps) {
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const handleLoadMore = async () => {
        setIsLoadingMore(true);
        try {
            await onLoadMore();
        } finally {
            setIsLoadingMore(false);
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to Load Activities</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={onRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                </Button>
            </div>
        );
    }

    if (isLoading && activities.length === 0) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-muted rounded" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                            <div className="w-16 h-8 bg-muted rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <EmptyState
                icon={BarChart3}
                title="No Activity Found"
                description="This address hasn't made any transactions yet, or the address might be invalid."
                actionLabel="Refresh"
                onAction={onRefresh}
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* Activity Items */}
            <div className="space-y-3">
                {activities.map((activity, index) => (
                    <ActivityItem
                        key={`${activity.digest}-${index}`}
                        digest={activity.digest}
                        timestamp={activity.timestamp}
                        sender={activity.sender}
                        type={activity.type}
                        gasUsed={activity.gasUsed}
                        operationsCount={activity.operationsCount}
                        participants={activity.participants}
                        onViewDetails={onViewDetails}
                    />
                ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="flex items-center gap-2"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-4 w-4" />
                                Load More
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* End of List Indicator */}
            {!hasMore && activities.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">You've reached the end of the activity list</p>
                </div>
            )}
        </div>
    );
}
