

import { useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";

interface ExpandableTextProps {
    text: string;
    type?: "address" | "hash" | "package";
    shortLength?: number;
    showExplorerLink?: boolean;
    className?: string;
}

export default function ExpandableText({
    text,
    type = "address",
    shortLength = 6,
    showExplorerLink = false,
    className = "",
}: ExpandableTextProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const shortText = text.length > shortLength * 2 ? `${text.slice(0, shortLength)}...${text.slice(-shortLength)}` : text;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    const getExplorerUrl = () => {
        if (type === "address") {
            return `https://suiexplorer.com/address/${text}`;
        } else if (type === "hash") {
            return `https://suiexplorer.com/txblock/${text}`;
        }
        return null;
    };

    const explorerUrl = getExplorerUrl();

    return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
            <span
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? text : shortText}
            </span>

            <button
                onClick={handleCopy}
                className="p-1 hover:bg-muted rounded transition-colors"
                title="Copy to clipboard"
            >
                {copied ? (
                    <Check className="h-3 w-3 text-green-600" />
                ) : (
                    <Copy className="h-3 w-3" />
                )}
            </button>

            {showExplorerLink && explorerUrl && (
                <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="View on Sui Explorer"
                >
                    <ExternalLink className="h-3 w-3" />
                </a>
            )}
        </span>
    );
}
