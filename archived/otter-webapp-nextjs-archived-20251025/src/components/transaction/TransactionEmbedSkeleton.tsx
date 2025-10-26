"use client";

import { Loader2 } from "lucide-react";

export default function TransactionEmbedSkeleton() {
    return (
        <div className="max-w-md border-l-4 border-muted bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="font-medium text-sm text-muted-foreground">Loading Transaction...</span>
            </div>

            <div className="space-y-2 mb-3">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="h-3 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded" />
            </div>

            <div className="flex gap-2">
                <div className="h-6 bg-muted animate-pulse rounded w-20" />
                <div className="h-6 bg-muted animate-pulse rounded w-16" />
                <div className="h-6 bg-muted animate-pulse rounded w-16" />
            </div>
        </div>
    );
}
