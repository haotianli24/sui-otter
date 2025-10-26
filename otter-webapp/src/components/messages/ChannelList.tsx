import { useMessaging } from '../../hooks/useMessaging';
import { useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

export function ChannelList() {
    const { channels, isFetchingChannels, fetchChannels, isReady } = useMessaging();

    useEffect(() => {
        console.log('Channels updated:', channels);
    }, [channels]);

    const formatTimestamp = (ms: string | number | bigint) => {
        const date = new Date(Number(ms));
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const formatAddress = (address: string) => {
        if (!address) return "Unknown";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Your Channels</CardTitle>
                        <CardDescription>Click on a channel to view messages</CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchChannels}
                        disabled={isFetchingChannels || !isReady}
                    >
                        {isFetchingChannels ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {!isReady ? (
                    <p className="text-sm muted-text truncate">
                        Waiting for messaging client to initialize...
                    </p>
                ) : isFetchingChannels && channels.length === 0 ? (
                    <p className="text-sm muted-text">Loading channels...</p>
                ) : channels.length === 0 ? (
                    <div className="py-8 text-center">
                        <p className="text-sm muted-text">
                            No channels yet. Create one above to start messaging!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {channels.sort((a, b) => {
                            const aTime = a.last_message ? Number(a.last_message.createdAtMs) : Number(a.created_at_ms);
                            const bTime = b.last_message ? Number(b.last_message.createdAtMs) : Number(b.created_at_ms);
                            return bTime - aTime;
                        }).map((channel) => (
                            <div
                                key={channel.id.id}
                                onClick={() => {
                                    window.location.hash = channel.id.id;
                                }}
                                className="p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                            >
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-semibold">Channel ID</p>
                                            <span className="text-xs muted-text">
                                                {channel.id.id.slice(0, 16)}...{channel.id.id.slice(-4)}
                                            </span>
                                        </div>
                                        <Badge variant="default">Active</Badge>
                                    </div>

                                    <div className="flex gap-6 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Messages</p>
                                            <p className="font-medium">{channel.messages_count}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Members</p>
                                            <p className="font-medium">{channel.auth.member_permissions.contents.length}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Created</p>
                                            <p className="font-medium">{formatTimestamp(channel.created_at_ms)}</p>
                                        </div>
                                    </div>

                                    {channel.last_message && (
                                        <div className="pt-3 border-t">
                                            <p className="text-xs text-muted-foreground mb-1">Last Message</p>
                                            <p className="text-sm">
                                                {channel.last_message.text.length > 50
                                                    ? `${channel.last_message.text.slice(0, 50)}...`
                                                    : channel.last_message.text}
                                            </p>
                                            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                                <span>from: {formatAddress(channel.last_message.sender)}</span>
                                                <span>• {formatTimestamp(channel.last_message?.createdAtMs)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {channels.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground">
                            Auto-refreshes every 10 seconds • {channels.length} channel{channels.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

