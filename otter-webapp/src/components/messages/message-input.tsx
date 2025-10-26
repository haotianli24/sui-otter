

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Plus, Coins, TrendingUp, FileText } from "lucide-react";
import { getFileMetadata, getFileIcon, formatFileSize, validateFile } from "../../lib/walrus-service";
import { useUserBalances } from "@/hooks/useUserBalances";
import { Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface MessageInputProps {
    onSend: (content: string, mediaFile?: File) => void;
    disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
    const [message, setMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileMetadata, setFileMetadata] = useState<{ filename: string; mimeType: string; size: number; category: 'image' | 'video' | 'document' | 'other' } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCryptoModal, setShowCryptoModal] = useState(false);
    const [showTradeModal, setShowTradeModal] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "44px";
            textareaRef.current.style.height = `${Math.min(
                textareaRef.current.scrollHeight,
                120
            )}px`;
        }
    }, [message]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSend = () => {
        if (message.trim() || selectedFile) {
            onSend(message, selectedFile || undefined);
            setMessage("");
            setSelectedFile(null);
            setPreviewUrl(null);
            setFileMetadata(null);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file
            const validation = validateFile(file);
            if (!validation.valid) {
                alert(validation.error);
                return;
            }

            setSelectedFile(file);
            const metadata = getFileMetadata(file);
            setFileMetadata(metadata);

            // Create preview URL for images and videos
            if (metadata.category === 'image' || metadata.category === 'video') {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setFileMetadata(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleDropdownToggle = () => {
        setShowDropdown(!showDropdown);
    };

    const handleSendCrypto = () => {
        setShowDropdown(false);
        setShowCryptoModal(true);
    };

    const handleSendTrade = () => {
        setShowDropdown(false);
        setShowTradeModal(true);
    };

    const handleSendFiles = () => {
        setShowDropdown(false);
        fileInputRef.current?.click();
    };

    return (
        <div className="p-4 border-t border-border bg-card">
            {/* File preview */}
            {selectedFile && fileMetadata && (
                <div className="mb-3 relative">
                    {fileMetadata.category === 'image' && previewUrl && (
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                        />
                    )}
                    {fileMetadata.category === 'video' && previewUrl && (
                        <video
                            src={previewUrl}
                            className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                            controls
                        />
                    )}
                    {(fileMetadata.category === 'document' || fileMetadata.category === 'other') && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg max-w-[300px]">
                            {(() => {
                                const IconComponent = getFileIcon(fileMetadata.category);
                                return <IconComponent className="h-8 w-8 text-muted-foreground" />;
                            })()}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{fileMetadata.filename}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(fileMetadata.size)}</p>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={removeFile}
                    >
                        ×
                    </Button>
                </div>
            )}

            <div className="flex items-end gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <div className="relative" ref={dropdownRef}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                        title="Add content"
                        onClick={handleDropdownToggle}
                    disabled={disabled}
                >
                        <Plus className="h-5 w-5" />
                </Button>
                    {showDropdown && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                            <div className="py-1">
                                <button
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-900 dark:text-gray-100"
                                    onClick={handleSendCrypto}
                                >
                                    <Coins className="h-4 w-4" />
                                    Send Crypto
                                </button>
                                <button
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-900 dark:text-gray-100"
                                    onClick={handleSendTrade}
                                >
                                    <TrendingUp className="h-4 w-4" />
                                    Send Trade
                                </button>
                                <button
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-900 dark:text-gray-100"
                                    onClick={handleSendFiles}
                                >
                                    <FileText className="h-4 w-4" />
                                    Send Files
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message... (Shift+Enter for new line)"
                    className="flex-1 min-h-[44px] max-h-[120px] px-4 py-3 bg-white dark:bg-gray-900 border border-input text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                    rows={1}
                    disabled={disabled}
                />
                <Button
                    onClick={handleSend}
                    disabled={(!message.trim() && !selectedFile) || disabled}
                    size="icon"
                    className="flex-shrink-0"
                    title="Send message (Enter)"
                >
                    <Send className="h-5 w-5" />
                </Button>
            </div>

            {/* Send Crypto Modal */}
            {showCryptoModal && (
                <SendCryptoModal 
                    onClose={() => setShowCryptoModal(false)}
                    onSend={(content) => {
                        onSend(content, undefined);
                        setShowCryptoModal(false);
                    }}
                />
            )}

            {/* Send Trade Modal */}
            {showTradeModal && (
                <SendTradeModal 
                    onClose={() => setShowTradeModal(false)}
                    onSend={(content) => {
                        onSend(content, undefined);
                        setShowTradeModal(false);
                    }}
                />
            )}
        </div>
    );
}

// Send Crypto Modal Component
function SendCryptoModal({ onClose, onSend }: { onClose: () => void; onSend: (content: string) => void }) {
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [selectedCoin, setSelectedCoin] = useState("SUI");
    const [isLoading, setIsLoading] = useState(false);
    const { data: balances = [], isLoading: isLoadingBalances } = useUserBalances();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
    const currentAccount = useCurrentAccount();

    // Get the selected coin balance
    const selectedCoinBalance = balances.find((b: any) => b.symbol === selectedCoin);
    const maxAmount = selectedCoinBalance ? parseFloat(selectedCoinBalance.balanceFormatted) : 0;

    const handleSend = async () => {
        if (!recipient.trim() || !amount.trim() || !currentAccount) return;
        
        setIsLoading(true);
        try {
            // Convert amount to MIST (1 SUI = 1,000,000,000 MIST)
            const amountInMist = Math.floor(parseFloat(amount) * 1_000_000_000);
            
            // Create transaction
            const tx = new Transaction();
            
            // Transfer SUI to recipient
            tx.transferObjects(
                [tx.splitCoins(tx.gas, [amountInMist])],
                recipient.trim()
            );

            // Execute transaction
            const result = await signAndExecute({
                transaction: tx,
            });

            if (result?.digest) {
                const transactionHash = result.digest;
                const content = `💰 Sent ${amount} ${selectedCoin} to ${recipient}\n\nTransaction: ${transactionHash}`;
                onSend(content);
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error("Error sending crypto:", error);
            // Fallback to text message if transaction fails
            const content = `💰 Attempted to send ${amount} ${selectedCoin} to ${recipient} (Transaction failed)`;
            onSend(content);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAmountChange = (value: string) => {
        // Only allow numbers and decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const setAmountToHalf = () => {
        if (maxAmount > 0) {
            setAmount((maxAmount / 2).toFixed(6));
        }
    };

    const setAmountToMax = () => {
        if (maxAmount > 0) {
            setAmount(maxAmount.toFixed(6));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 border border-border rounded-lg p-6 w-full max-w-md mx-4 shadow-lg opacity-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Send Crypto</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        ×
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Recipient</label>
                        <input
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder="Enter username or wallet address"
                            className="w-full px-3 py-2 border border-input rounded-md bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium mb-2 block">Coin</label>
                        <select
                            value={selectedCoin}
                            onChange={(e) => setSelectedCoin(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-ring"
                            disabled={isLoadingBalances}
                        >
                            {isLoadingBalances ? (
                                <option>Loading balances...</option>
                            ) : balances.length === 0 ? (
                                <option>No coins found</option>
                            ) : (
                                balances.map((coin: any) => (
                                    <option key={coin.symbol} value={coin.symbol}>
                                        {coin.icon} {coin.name} ({coin.symbol}) - {coin.balanceFormatted}
                                    </option>
                                ))
                            )}
                        </select>
                        {selectedCoinBalance && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Balance: {selectedCoinBalance.balanceFormatted} {selectedCoinBalance.symbol}
                            </p>
                        )}
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium mb-2 block">Amount</label>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-input rounded-md bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-ring"
                                disabled={!selectedCoinBalance || maxAmount === 0}
                            />
                            {selectedCoinBalance && maxAmount > 0 && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={setAmountToHalf}
                                        className="flex-1 px-3 py-1.5 border border-input bg-white dark:bg-gray-900 text-sm font-medium rounded-md hover:border-primary hover:text-primary hover:bg-primary/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        1/2
                                    </button>
                                    <button
                                        type="button"
                                        onClick={setAmountToMax}
                                        className="flex-1 px-3 py-1.5 border border-input bg-white dark:bg-gray-900 text-sm font-medium rounded-md hover:border-primary hover:text-primary hover:bg-primary/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        MAX
                                    </button>
                                </div>
                            )}
                            {amount && parseFloat(amount) > maxAmount && maxAmount > 0 && (
                                <p className="text-xs text-red-500">
                                    Amount exceeds your balance of {selectedCoinBalance?.balanceFormatted} {selectedCoinBalance?.symbol}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                    <button 
                        onClick={onClose} 
                        className="flex-1 px-4 py-2 border border-input bg-white dark:bg-gray-900 text-sm font-medium rounded-md hover:border-primary hover:text-primary hover:bg-primary/10 transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSend} 
                        disabled={!recipient.trim() || !amount.trim() || isLoading || !selectedCoinBalance || maxAmount === 0 || parseFloat(amount) > maxAmount}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:hover:bg-primary disabled:hover:shadow-none"
                    >
                        {isLoading ? "Sending..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Send Trade Modal Component
function SendTradeModal({ onClose, onSend }: { onClose: () => void; onSend: (content: string) => void }) {
    const [selectedTrade, setSelectedTrade] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    // Mock recent trades data
    const recentTrades = [
        { id: "1", pair: "SUI/USDC", type: "Buy", amount: "100 SUI", price: "$0.45", time: "2 min ago" },
        { id: "2", pair: "USDC/SUI", type: "Sell", amount: "50 USDC", price: "$0.44", time: "5 min ago" },
        { id: "3", pair: "SUI/USDT", type: "Buy", amount: "200 SUI", price: "$0.46", time: "10 min ago" },
    ];

    const handleSend = async () => {
        if (!selectedTrade) return;
        
        setIsLoading(true);
        try {
            const trade = recentTrades.find(t => t.id === selectedTrade);
            const content = `📈 Trade Update: ${trade?.type} ${trade?.amount} at ${trade?.price} (${trade?.pair})`;
            onSend(content);
        } catch (error) {
            console.error("Error sending trade:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 border border-border rounded-lg p-6 w-full max-w-md mx-4 shadow-lg opacity-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Send Trade</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        ×
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Select Recent Trade</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {recentTrades.map((trade) => (
                                <label key={trade.id} className="flex items-center space-x-3 p-3 border border-border rounded-md hover:bg-accent cursor-pointer">
                                    <input
                                        type="radio"
                                        name="trade"
                                        value={trade.id}
                                        checked={selectedTrade === trade.id}
                                        onChange={(e) => setSelectedTrade(e.target.value)}
                                        className="text-primary"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{trade.pair}</span>
                                            <span className={`text-sm ${trade.type === 'Buy' ? 'text-green-600' : 'text-red-600'}`}>
                                                {trade.type}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {trade.amount} at {trade.price} • {trade.time}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                    <button 
                        onClick={onClose} 
                        className="flex-1 px-4 py-2 border border-input bg-white dark:bg-gray-900 text-sm font-medium rounded-md hover:border-primary hover:text-primary hover:bg-primary/10 transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSend} 
                        disabled={!selectedTrade || isLoading}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:hover:bg-primary disabled:hover:shadow-none"
                    >
                        {isLoading ? "Sending..." : "Send Trade"}
                    </button>
                </div>
            </div>
        </div>
    );
}

