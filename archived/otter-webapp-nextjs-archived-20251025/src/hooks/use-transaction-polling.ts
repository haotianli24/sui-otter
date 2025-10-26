"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface ActivityItem {
    digest: string;
    timestamp: string;
    sender: string;
    type: 'incoming' | 'outgoing';
    gasUsed: string;
    operationsCount: number;
    participants: string[];
}

interface UseTransactionPollingOptions {
    address: string;
    interval?: number; // in milliseconds
    limit?: number;
    enabled?: boolean;
}

interface UseTransactionPollingReturn {
    activities: ActivityItem[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    newCount: number;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    isPolling: boolean;
    pausePolling: () => void;
    resumePolling: () => void;
}

export function useTransactionPolling({
    address,
    interval = 30000, // 30 seconds
    limit = 50,
    enabled = true
}: UseTransactionPollingOptions): UseTransactionPollingReturn {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newCount, setNewCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isPolling, setIsPolling] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastDigestRef = useRef<string | null>(null);
    const cursorRef = useRef<string | undefined>(undefined);
    const isInitialLoadRef = useRef(true);
    const isPollingPausedRef = useRef(false);

    const fetchActivities = useCallback(async (isRefresh = false) => {
        if (!address || !enabled) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/address-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    limit: isRefresh ? limit : Math.min(limit, 20), // Smaller limit for polling
                    cursor: isRefresh ? undefined : cursorRef.current
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch activities: ${response.statusText}`);
            }

            const data = await response.json();

            if (isRefresh || isInitialLoadRef.current) {
                // Replace activities on refresh or initial load
                setActivities(data.activities);
                setNewCount(0);
                isInitialLoadRef.current = false;
            } else {
                // Check for new activities during polling
                const newActivities = data.activities.filter((activity: ActivityItem) =>
                    !activities.some(existing => existing.digest === activity.digest)
                );

                if (newActivities.length > 0) {
                    setActivities(prev => [...newActivities, ...prev]);
                    setNewCount(prev => prev + newActivities.length);
                }
            }

            setHasMore(data.hasMore);
            cursorRef.current = data.nextCursor;

            // Update last digest for new activity detection
            if (data.activities.length > 0) {
                lastDigestRef.current = data.activities[0].digest;
            }

        } catch (err) {
            console.error('Error fetching activities:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch activities');
        } finally {
            setIsLoading(false);
        }
    }, [address, limit, enabled]);

    const refresh = useCallback(async () => {
        await fetchActivities(true);
    }, [fetchActivities]);

    const loadMore = useCallback(async () => {
        if (!hasMore || isLoading) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/address-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    limit,
                    cursor: cursorRef.current
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to load more activities: ${response.statusText}`);
            }

            const data = await response.json();

            setActivities(prev => [...prev, ...data.activities]);
            setHasMore(data.hasMore);
            cursorRef.current = data.nextCursor;

        } catch (err) {
            console.error('Error loading more activities:', err);
            setError(err instanceof Error ? err.message : 'Failed to load more activities');
        } finally {
            setIsLoading(false);
        }
    }, [address, limit, hasMore, isLoading]);

    const pausePolling = useCallback(() => {
        isPollingPausedRef.current = true;
        setIsPolling(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const resumePolling = useCallback(() => {
        isPollingPausedRef.current = false;
        if (enabled && address) {
            setIsPolling(true);
            intervalRef.current = setInterval(() => {
                if (!isPollingPausedRef.current) {
                    fetchActivities(false);
                }
            }, interval);
        }
    }, [enabled, address, interval, fetchActivities]);

    // Handle visibility change (pause when tab is hidden)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                pausePolling();
            } else if (enabled && address) {
                resumePolling();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [enabled, address, pausePolling, resumePolling]);

    // Start/stop polling based on enabled state and address
    useEffect(() => {
        if (enabled && address && address.length > 0 && !isPollingPausedRef.current) {
            // Initial fetch
            fetchActivities(true);

            // Start polling
            setIsPolling(true);
            intervalRef.current = setInterval(() => {
                if (!isPollingPausedRef.current) {
                    fetchActivities(false);
                }
            }, interval);
        } else {
            pausePolling();
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [enabled, address, interval, fetchActivities, pausePolling]);

    // Reset activities when address changes
    useEffect(() => {
        if (address && address.length > 0) {
            setActivities([]);
            setNewCount(0);
            setError(null);
        }
    }, [address]);

    // Clear new count when user manually refreshes
    const handleRefresh = useCallback(async () => {
        setNewCount(0);
        await refresh();
    }, [refresh]);

    return {
        activities,
        isLoading,
        error,
        refresh: handleRefresh,
        newCount,
        hasMore,
        loadMore,
        isPolling,
        pausePolling,
        resumePolling
    };
}
