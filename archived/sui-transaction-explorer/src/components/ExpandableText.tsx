'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface ExpandableTextProps {
    text: string;
    type: 'address' | 'hash' | 'objectId' | 'package';
    shortLength?: number;
    className?: string;
    showExplorerLink?: boolean;
}

const getExplorerUrl = (type: string, value: string) => {
    const baseUrl = 'https://suiscan.xyz/mainnet';
    switch (type) {
        case 'address':
            return `${baseUrl}/account/${value}`;
        case 'hash':
            return `${baseUrl}/tx/${value}`;
        case 'objectId':
            return `${baseUrl}/object/${value}`;
        case 'package':
            return `${baseUrl}/package/${value}`;
        default:
            return '#';
    }
};

export default function ExpandableText({
    text,
    type,
    shortLength = 10,
    className = '',
    showExplorerLink = false,
}: ExpandableTextProps) {
    const [copied, setCopied] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const displayedText = text.length > shortLength + 4
        ? `${text.slice(0, shortLength)}...${text.slice(-4)}`
        : text;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    const explorerUrl = getExplorerUrl(type, text);

    return (
        <span className={`inline-flex items-center space-x-1 font-mono text-gray-800 ${className}`}>
            <span
                className="cursor-pointer relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {displayedText}
                {showTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50">
                        {text}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                )}
            </span>
            <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                title="Copy to clipboard"
            >
                {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-gray-500" />}
            </button>
            {showExplorerLink && explorerUrl !== '#' && (
                <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    title="View on Sui Explorer"
                >
                    <ExternalLink className="h-3 w-3 text-blue-500" />
                </a>
            )}
        </span>
    );
}