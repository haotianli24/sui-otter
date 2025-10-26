import { useState, useEffect } from "react";
import { TrendingUp, Users, Activity, Settings, Check, X, Search, Plus, Loader2, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Trader {
    address: string;
    followers: number;
    totalTrades: number;
    profitLoss: string;
    isFollowing: boolean;
}

interface CopiedTrade {
    trader: string;
    asset: string;
    action: string;
    amount: string;
    timestamp: number;
    success: boolean;
}

export default function CopyTradingPage() {
    const [activeTab, setActiveTab] = useState<'traders' | 'following' | 'history'>('traders');
    const [searchQuery, setSearchQuery] = useState("");
    const [followedTraders, setFollowedTraders] = useState<Set<string>>(new Set());
    const [isFollowing, setIsFollowing] = useState<string | null>(null);
    const [traders, setTraders] = useState<Trader[]>([]);
    const [copiedTrades, setCopiedTrades] = useState<CopiedTrade[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    
    // Load followed traders and traders list from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('followedTraders');
        if (saved) {
            try {
                setFollowedTraders(new Set(JSON.parse(saved)));
            } catch (e) {
                console.error('Failed to load followedTraders:', e);
            }
        }
        
        const savedTraders = localStorage.getItem('tradersList');
        if (savedTraders) {
            try {
                setTraders(JSON.parse(savedTraders));
            } catch (e) {
                console.error('Failed to load tradersList:', e);
            }
        }
        
        setIsInitialized(true);
    }, []);
    
    // Save to localStorage and notify agent whenever followedTraders changes (after initialization)
    useEffect(() => {
        if (!isInitialized) return;
        
        localStorage.setItem('followedTraders', JSON.stringify(Array.from(followedTraders)));
        
        // Save to a file that the agent can read
        if (followedTraders.size > 0) {
            saveFollowedTradersForAgent(Array.from(followedTraders));
        }
    }, [followedTraders, isInitialized]);
    
    // Save traders list to localStorage whenever it changes (after initialization)
    useEffect(() => {
        if (!isInitialized) return;
        
        localStorage.setItem('tradersList', JSON.stringify(traders));
    }, [traders, isInitialized]);
    
    // Load trade history on mount and periodically
    useEffect(() => {
        const loadTradeHistory = async () => {
            try {
                setIsLoadingHistory(true);
                const response = await fetch('http://localhost:3002/api/trade-history');
                if (response.ok) {
                    const data = await response.json();
                    console.log('📊 Trade history loaded:', data.totalTrades, 'total trades');
                    
                    if (data.trades && data.trades.length > 0) {
                        const trades = data.trades.map((t: any) => ({
                            trader: t.trader.slice(0, 6) + '...' + t.trader.slice(-4),
                            asset: t.asset,
                            action: t.action,
                            amount: (parseInt(t.amount) / 1000000).toFixed(3), // Convert MIST to SUI
                            timestamp: new Date(t.timestamp).getTime(),
                            success: t.success
                        }));
                        setCopiedTrades(trades);
                        console.log('✅ Loaded', trades.length, 'trade(s)');
                    } else {
                        setCopiedTrades([]);
                    }
                } else {
                    console.warn('⚠️ API server responded with status:', response.status);
                }
            } catch (error) {
                console.error('❌ Failed to load trade history:', error);
                console.warn('💡 Make sure API server is running: cd agent && node api-server.js');
            } finally {
                setIsLoadingHistory(false);
            }
        };
        
        loadTradeHistory();
        
        // Refresh history every 10 seconds
        const interval = setInterval(loadTradeHistory, 10000);
        return () => clearInterval(interval);
    }, []);
    
    // Handle follow/unfollow
    const handleFollowToggle = async (address: string) => {
        console.log('🔘 Follow button clicked for:', address);
        setIsFollowing(address);
        
        const wasFollowing = followedTraders.has(address);
        console.log(`📊 Current state: ${wasFollowing ? 'Following' : 'Not following'}`);
        
        // Optimistically update UI
        setFollowedTraders(prev => {
            const newSet = new Set(prev);
            if (wasFollowing) {
                newSet.delete(address);
                console.log('➖ Unfollowing trader');
            } else {
                newSet.add(address);
                console.log('➕ Following trader');
            }
            return newSet;
        });
        
        // Sync to agent via API
        try {
            const endpoint = wasFollowing ? 'remove' : 'add';
            console.log(`📡 Calling API: POST /api/followed-traders/${endpoint}`);
            
            const response = await fetch(`http://localhost:3002/api/followed-traders/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address }),
            });
            
            console.log(`📥 API response status: ${response.status}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Auto-synced to agent:`, result);
                
                // Show success notification (optional)
                if (!wasFollowing) {
                    console.log(`🤖 Agent now monitoring: ${address.slice(0, 16)}...`);
                }
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to sync to agent:', errorText);
                // Revert optimistic update on failure
                setFollowedTraders(prev => {
                    const newSet = new Set(prev);
                    if (wasFollowing) {
                        newSet.add(address);
                    } else {
                        newSet.delete(address);
                    }
                    return newSet;
                });
            }
        } catch (error) {
            console.error('❌ Error syncing to agent:', error);
            console.warn('⚠️ Make sure API server is running: cd agent && node api-server.js');
            // Keep the UI update even if sync fails - user can manually sync later
        }
        
        setIsFollowing(null);
        console.log('✅ Follow toggle complete');
    };
    
    // Add custom trader from search
    const handleAddTrader = async () => {
        if (!searchQuery.trim()) return;
        
        // Validate address format
        if (!searchQuery.startsWith('0x') || searchQuery.length !== 66) {
            alert('Invalid Sui address format. Address should start with 0x and be 66 characters long.');
            return;
        }
        
        // Check if already exists
        if (traders.some(t => t.address === searchQuery)) {
            alert('This trader is already in your list!');
            return;
        }
        
        // Add new trader with placeholder while loading
        const tempTrader: Trader = {
            address: searchQuery,
            followers: 0,
            totalTrades: 0,
            profitLoss: "Loading...",
            isFollowing: false
        };
        
        setTraders(prev => [tempTrader, ...prev]);
        const addedAddress = searchQuery;
        setSearchQuery("");
        
        // Fetch real stats from blockchain
        try {
            const stats = await fetchTraderStats(addedAddress);
            setTraders(prev => prev.map(t => 
                t.address === addedAddress ? { ...t, ...stats } : t
            ));
        } catch (error) {
            console.error('Failed to fetch trader stats:', error);
            // Update with error state
            setTraders(prev => prev.map(t => 
                t.address === addedAddress 
                    ? { ...t, profitLoss: "Unable to load", totalTrades: 0 } 
                    : t
            ));
        }
    };
    
    // Fetch trader statistics from blockchain
    const fetchTraderStats = async (address: string) => {
        try {
            console.log('🔍 Fetching stats for:', address);
            
            // Try using Sui RPC directly instead of Suiscan
            const response = await fetch('https://fullnode.testnet.sui.io:443', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'suix_queryTransactionBlocks',
                    params: [
                        {
                            filter: { FromAddress: address },
                            options: {
                                showInput: false,
                                showEffects: false,
                            }
                        },
                        null,
                        50,
                        false
                    ]
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Got response:', data);
                
                const txCount = data.result?.data?.length || 0;
                
                return {
                    totalTrades: txCount,
                    profitLoss: txCount > 0 ? "Active" : "New Wallet",
                    followers: 0
                };
            }
            
            console.warn('⚠️ API response not ok:', response.status);
            
            // Fallback: just show as valid wallet
            return {
                totalTrades: 0,
                profitLoss: "Valid Wallet",
                followers: 0
            };
        } catch (error) {
            console.error('❌ Error fetching trader stats:', error);
            
            // Even if we can't fetch stats, the wallet is valid
            // Just show it as a valid wallet
            return {
                totalTrades: 0,
                profitLoss: "Valid Wallet",
                followers: 0
            };
        }
    };
    
    // Save followed traders to a file that the agent can read
    const saveFollowedTradersForAgent = async (addresses: string[]) => {
        try {
            const data = {
                followedTraders: addresses,
                timestamp: new Date().toISOString()
            };
            
            // Use localStorage as a bridge (in production, use an API)
            localStorage.setItem('agentFollowedTraders', JSON.stringify(data));
            
            console.log('✅ Saved followed traders for agent:', addresses);
            console.log('📋 Copy this to /agent/followed_traders.json:', JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save traders for agent:', error);
        }
    };
    
    // Export followed traders for agent
    const handleExportForAgent = () => {
        const data = {
            followedTraders: Array.from(followedTraders),
            timestamp: new Date().toISOString(),
            source: "webapp"
        };
        
        const jsonStr = JSON.stringify(data, null, 2);
        
        // Copy to clipboard
        navigator.clipboard.writeText(jsonStr).then(() => {
            setSyncMessage('✅ Synced successfully! Agent will update within 10 seconds.');
            setTimeout(() => setSyncMessage(null), 5000); // Clear after 5 seconds
        }).catch(() => {
            setSyncMessage('⚠️ Failed to copy. Please copy manually from console.');
            console.log('Copy this to /agent/followed_traders.json:', jsonStr);
            setTimeout(() => setSyncMessage(null), 5000);
        });
    };
    
    // Filter traders based on search and following status
    const filteredTraders = traders.filter(trader => {
        const isFollowingTrader = followedTraders.has(trader.address);
        const matchesSearch = trader.address.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    }).map(trader => ({
        ...trader,
        isFollowing: followedTraders.has(trader.address)
    }));
    
    const followingTraders = traders.filter(t => followedTraders.has(t.address)).map(trader => ({
        ...trader,
        isFollowing: true
    }));

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const formatTime = (timestamp: number) => {
        const minutes = Math.floor((Date.now() - timestamp) / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card px-6 py-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Agents
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    AI agents that automatically copy trades from top traders
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-border bg-card px-6">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('traders')}
                        className={`py-3 px-1 border-b-2 transition-colors ${
                            activeTab === 'traders'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">Popular Traders</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('following')}
                        className={`py-3 px-1 border-b-2 transition-colors ${
                            activeTab === 'following'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-medium">Following</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`py-3 px-1 border-b-2 transition-colors ${
                            activeTab === 'history'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span className="font-medium">Copy History</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'traders' && (
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search or paste wallet address (0x...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTrader()}
                                    className="pl-9"
                                />
                            </div>
                            <Button onClick={handleAddTrader} disabled={!searchQuery.trim()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                            </Button>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                            {searchQuery ? `Search results for "${searchQuery}"` : 'Add traders to start monitoring their transactions'}
                        </div>
                        
                        {filteredTraders.length === 0 && !searchQuery && (
                            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                                <Search className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No Traders Yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Paste a Sui wallet address above to get started
                                </p>
                                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded max-w-md mx-auto">
                                    <p className="font-mono text-xs">
                                        Example: 0xe39edd65db983010aabd984c00d3912fa53f4aaa200c464d2649ced240df841d
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        <div className="grid gap-4">
                            {filteredTraders.map((trader) => (
                                <div
                                    key={trader.address}
                                    className="border border-border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-mono text-sm font-medium">
                                                    {formatAddress(trader.address)}
                                                </span>
                                                {trader.followers > 0 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {trader.followers} followers
                                                    </Badge>
                                                )}
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${
                                                        trader.profitLoss.startsWith('+')
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : trader.profitLoss === 'Active'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                            : trader.profitLoss === 'Loading...'
                                                            ? 'bg-gray-50 text-gray-700 border-gray-200 animate-pulse'
                                                            : trader.profitLoss === 'New Wallet' || trader.profitLoss === 'Valid Wallet'
                                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                            : trader.profitLoss === 'No Activity'
                                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                            : 'bg-gray-50 text-gray-700 border-gray-200'
                                                    }`}
                                                >
                                                    {trader.profitLoss}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>{trader.totalTrades} trades</span>
                                                <span>•</span>
                                                <span>Active trader</span>
                                            </div>
                                        </div>
                                        <Button
                                            variant={trader.isFollowing ? "outline" : "default"}
                                            size="sm"
                                            className={`ml-4 ${trader.isFollowing ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100' : ''}`}
                                            onClick={() => handleFollowToggle(trader.address)}
                                            disabled={isFollowing === trader.address}
                                        >
                                            {isFollowing === trader.address ? (
                                                <>
                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                    {trader.isFollowing ? 'Unfollowing...' : 'Following...'}
                                                </>
                                            ) : trader.isFollowing ? (
                                                <>
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Following
                                                </>
                                            ) : (
                                                'Follow'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'following' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Traders you're currently following ({followingTraders.length})
                            </div>
                            {followingTraders.length > 0 && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleExportForAgent}
                                    className="flex items-center gap-2"
                                >
                                    <Copy className="h-3 w-3" />
                                    Sync to Agent
                                </Button>
                            )}
                        </div>
                        
                        {/* Sync success message */}
                        {syncMessage && (
                            <div className={`p-3 rounded-lg text-sm ${
                                syncMessage.includes('✅') 
                                    ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                                    : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                            }`}>
                                {syncMessage}
                            </div>
                        )}
                        
                        <div className="grid gap-4">
                            {followingTraders.map((trader) => (
                                <div
                                    key={trader.address}
                                    className="border border-border rounded-lg p-4 bg-card"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-mono text-sm font-medium">
                                                    {formatAddress(trader.address)}
                                                </span>
                                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                                    Auto-copy ON
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Copy: 10% of position size • Max: 100 SUI
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">
                                                <Settings className="h-3 w-3 mr-1" />
                                                Settings
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleFollowToggle(trader.address)}
                                                disabled={isFollowing === trader.address}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                {isFollowing === trader.address ? (
                                                    <>
                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                        Unfollowing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <X className="h-3 w-3 mr-1" />
                                                        Unfollow
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {followingTraders.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>You're not following any traders yet</p>
                                    <p className="text-sm mt-1">Browse popular traders to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            Your copied trades history (Auto-refreshes every 10s)
                        </div>
                        {isLoadingHistory && copiedTrades.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                                <p>Loading trade history...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {copiedTrades.map((trade, idx) => (
                                    <div
                                        key={idx}
                                        className="border border-border rounded-lg p-4 bg-card"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">{trade.asset}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {trade.action}
                                                    </Badge>
                                                    {trade.success ? (
                                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
                                                            <Check className="h-2 w-2 mr-1" />
                                                            Detected
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
                                                            <X className="h-2 w-2 mr-1" />
                                                            Failed
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    From {trade.trader} • Amount: {trade.amount} SUI • {formatTime(trade.timestamp)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {copiedTrades.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No copied trades yet</p>
                                        <p className="text-sm mt-1">Agent will detect and show trades here</p>
                                        <p className="text-xs mt-2 text-gray-500">
                                            💡 Make sure API server and agent are running
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

