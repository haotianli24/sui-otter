import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-muted mb-4">
                    <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground mb-6">{description}</p>
                {actionLabel && onAction && (
                    <Button onClick={onAction}>{actionLabel}</Button>
                )}
            </div>
        </div>
    );
}

