import { useState, useEffect } from "react";
import { TrendingUp, Users, Activity, Settings, Check, X, Search, Plus, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { 
    buildFollowTraderTx, 
    buildUnfollowTraderTx, 
    getFollowedTraders,
    getCopySettings,
    buildUpdateSettingsTx
} from "@/lib/copy-trading-contract";

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
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    
    const [activeTab, setActiveTab] = useState<'traders' | 'following' | 'history'>('traders');
    const [searchQuery, setSearchQuery] = useState("");
    const [followedTraders, setFollowedTraders] = useState<Set<string>>(new Set());
    const [isFollowing, setIsFollowing] = useState<string | null>(null);
    const [traders, setTraders] = useState<Trader[]>([]);
    const [copiedTrades, setCopiedTrades] = useState<CopiedTrade[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [showMigrationBanner, setShowMigrationBanner] = useState(false);
    
    // Settings modal state
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [selectedTrader, setSelectedTrader] = useState<string | null>(null);
    const [traderSettings, setTraderSettings] = useState<Record<string, {
        copyPercentage: number;
        maxTradeSize: string;
        autoCopyEnabled: boolean;
    }>>({});
    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
    
    // Settings form state
    const [settingsCopyPercentage, setSettingsCopyPercentage] = useState(10);
    const [settingsMaxTradeSize, setSettingsMaxTradeSize] = useState("100000000");
    const [settingsAutoCopyEnabled, setSettingsAutoCopyEnabled] = useState(true);
    
    // Load followed traders from smart contract on mount
    useEffect(() => {
        const loadFollowedTraders = async () => {
            if (!currentAccount?.address) {
                console.log('⚠️ No wallet connected - clearing follows');
                // Clear follows when wallet disconnected
                setFollowedTraders(new Set());
                setShowMigrationBanner(false);
                setIsInitialized(true);
                return;
            }
            
            try {
                console.log('🔍 Loading followed traders from smart contract...');
                const followed = await getFollowedTraders(suiClient, currentAccount.address);
                console.log('✅ Loaded followed traders from contract:', followed);
                
                // If contract is empty, check wallet-specific localStorage for migration
                if (followed.length === 0) {
                    const walletKey = `followedTraders_${currentAccount.address}`;
                    const saved = localStorage.getItem(walletKey);
                    
                    // Also check old global key for backwards compatibility
                    const oldSaved = !saved ? localStorage.getItem('followedTraders') : null;
                    
                    const localData = saved || oldSaved;
                    if (localData) {
                        try {
                            const localFollows = JSON.parse(localData);
                            if (localFollows.length > 0) {
                                console.log('📦 Migrating follows from localStorage for this wallet:', localFollows);
                                console.log('💡 Tip: Click "Follow" again to save these to the blockchain');
                                setFollowedTraders(new Set(localFollows));
                                setShowMigrationBanner(true);
                                
                                // Save to wallet-specific key
                                localStorage.setItem(walletKey, JSON.stringify(localFollows));
                                return; // Skip setting empty contract data
                            }
                        } catch (e) {
                            console.error('Failed to parse localStorage:', e);
                        }
                    }
                }
                
                setFollowedTraders(new Set(followed));
            } catch (error) {
                console.error('❌ Error loading followed traders from contract:', error);
                // Fallback to localStorage on error
                const saved = localStorage.getItem('followedTraders');
                if (saved) {
                    try {
                        setFollowedTraders(new Set(JSON.parse(saved)));
                    } catch (e) {
                        console.error('Failed to load followedTraders:', e);
                    }
                }
            } finally {
                // Load traders list from localStorage
                const savedTraders = localStorage.getItem('tradersList');
                if (savedTraders) {
                    try {
                        setTraders(JSON.parse(savedTraders));
                    } catch (e) {
                        console.error('Failed to load tradersList:', e);
                    }
                }
                setIsInitialized(true);
            }
        };
        
        loadFollowedTraders();
    }, [currentAccount?.address, suiClient]);
    
    // Save to wallet-specific localStorage whenever followedTraders changes (after initialization)
    useEffect(() => {
        if (!isInitialized || !currentAccount?.address) return;
        
        const walletKey = `followedTraders_${currentAccount.address}`;
        localStorage.setItem(walletKey, JSON.stringify(Array.from(followedTraders)));
        
        console.log(`💾 Saved follows for wallet ${currentAccount.address.slice(0, 8)}...`);
    }, [followedTraders, isInitialized, currentAccount?.address]);
    
    // Save traders list to localStorage whenever it changes (after initialization)
    useEffect(() => {
        if (!isInitialized) return;
        
        localStorage.setItem('tradersList', JSON.stringify(traders));
    }, [traders, isInitialized]);
    
    // Load settings for each followed trader
    useEffect(() => {
        const loadSettings = async () => {
            if (!currentAccount?.address || followedTraders.size === 0) return;
            
            const settingsMap: Record<string, {
                copyPercentage: number;
                maxTradeSize: string;
                autoCopyEnabled: boolean;
            }> = {};
            
            for (const traderAddress of Array.from(followedTraders)) {
                try {
                    const settings = await getCopySettings(suiClient, currentAccount.address, traderAddress);
                    if (settings) {
                        settingsMap[traderAddress] = settings;
                    } else {
                        // Default settings if not found
                        settingsMap[traderAddress] = {
                            copyPercentage: 10,
                            maxTradeSize: "100000000",
                            autoCopyEnabled: true
                        };
                    }
                } catch (error) {
                    console.error(`Error loading settings for ${traderAddress}:`, error);
                    // Use defaults on error
                    settingsMap[traderAddress] = {
                        copyPercentage: 10,
                        maxTradeSize: "100000000",
                        autoCopyEnabled: true
                    };
                }
            }
            
            setTraderSettings(settingsMap);
        };
        
        loadSettings();
    }, [currentAccount?.address, followedTraders, suiClient]);
    
    // Load trade history on mount and periodically (wallet-specific)
    useEffect(() => {
        // Clear history if no wallet connected
        if (!currentAccount?.address) {
            setCopiedTrades([]);
            return;
        }
        
        const loadTradeHistory = async () => {
            try {
                setIsLoadingHistory(true);
                const response = await fetch('http://localhost:3002/api/trade-history');
                if (response.ok) {
                    const data = await response.json();
                    console.log('📊 Trade history loaded:', data.totalTrades, 'total trades');
                    
                    if (data.trades && data.trades.length > 0) {
                        // Filter trades for current wallet only
                        const myTrades = data.trades.filter((t: any) => 
                            t.follower === currentAccount.address
                        );
                        
                        const trades = myTrades.map((t: any) => ({
                            trader: t.trader.slice(0, 6) + '...' + t.trader.slice(-4),
                            asset: t.asset,
                            action: t.action,
                            amount: (parseInt(t.amount) / 1000000).toFixed(3), // Convert MIST to SUI
                            timestamp: new Date(t.timestamp).getTime(),
                            success: t.success
                        }));
                        setCopiedTrades(trades);
                        console.log(`✅ Loaded ${trades.length} trade(s) for wallet ${currentAccount.address.slice(0, 8)}...`);
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
    }, [currentAccount?.address]);
    
    // Handle follow/unfollow via smart contract
    const handleFollowToggle = async (address: string) => {
        if (!currentAccount?.address) {
            alert('Please connect your wallet first');
            return;
        }
        
        console.log('🔘 Follow button clicked for:', address);
        setIsFollowing(address);
        
        const wasFollowing = followedTraders.has(address);
        console.log(`📊 Current state: ${wasFollowing ? 'Following' : 'Not following'}`);
        
        try {
            // Build transaction
            const tx = wasFollowing ? buildUnfollowTraderTx(address) : buildFollowTraderTx(address);
            
            console.log(`📝 Submitting ${wasFollowing ? 'unfollow' : 'follow'} transaction to blockchain...`);
            
            // Execute transaction
            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        console.log('✅ Transaction successful:', result.digest);
                        
                        // Update UI
                        setFollowedTraders(prev => {
                            const newSet = new Set(prev);
                            if (wasFollowing) {
                                newSet.delete(address);
                                console.log('➖ Unfollowed trader on-chain');
                            } else {
                                newSet.add(address);
                                console.log('➕ Followed trader on-chain');
                            }
                            return newSet;
                        });
                        
                        // The agent will automatically pick this up from the smart contract events!
                        console.log('🤖 Agent will automatically detect this change from the smart contract');
                        
                        setIsFollowing(null);
                    },
                    onError: (error) => {
                        console.error('❌ Transaction failed:', error);
                        alert(`Failed to ${wasFollowing ? 'unfollow' : 'follow'} trader: ${error.message}`);
                        setIsFollowing(null);
                    },
                }
            );
        } catch (error) {
            console.error('Error building transaction:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsFollowing(null);
        }
    };
    
    // Open settings modal
    const handleOpenSettings = (traderAddress: string) => {
        setSelectedTrader(traderAddress);
        const settings = traderSettings[traderAddress] || {
            copyPercentage: 10,
            maxTradeSize: "100000000",
            autoCopyEnabled: true
        };
        setSettingsCopyPercentage(settings.copyPercentage);
        setSettingsMaxTradeSize(settings.maxTradeSize);
        setSettingsAutoCopyEnabled(settings.autoCopyEnabled);
        setSettingsModalOpen(true);
    };
    
    // Update settings on blockchain
    const handleUpdateSettings = async () => {
        if (!currentAccount?.address || !selectedTrader) return;
        
        setIsUpdatingSettings(true);
        
        try {
            const tx = buildUpdateSettingsTx(
                selectedTrader,
                settingsCopyPercentage,
                settingsMaxTradeSize,
                settingsAutoCopyEnabled
            );
            
            console.log(`📝 Updating settings for trader ${selectedTrader}...`);
            
            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => {
                        console.log('✅ Settings updated successfully:', result.digest);
                        
                        // Update local state
                        setTraderSettings(prev => ({
                            ...prev,
                            [selectedTrader]: {
                                copyPercentage: settingsCopyPercentage,
                                maxTradeSize: settingsMaxTradeSize,
                                autoCopyEnabled: settingsAutoCopyEnabled
                            }
                        }));
                        
                        setIsUpdatingSettings(false);
                        setSettingsModalOpen(false);
                        setSelectedTrader(null);
                    },
                    onError: (error) => {
                        console.error('❌ Failed to update settings:', error);
                        alert(`Failed to update settings: ${error.message}`);
                        setIsUpdatingSettings(false);
                    }
                }
            );
        } catch (error) {
            console.error('Error building settings transaction:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsUpdatingSettings(false);
        }
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
        const matchesSearch = trader.address.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    }).map(trader => ({
        ...trader,
        isFollowing: followedTraders.has(trader.address)
    }));
    
    // Build followingTraders list - includes both known traders and followed addresses not in traders list
    const followingTraders = (() => {
        const result: Trader[] = [];
        
        // Add known traders that are being followed
        traders.filter(t => followedTraders.has(t.address)).forEach(trader => {
            result.push({ ...trader, isFollowing: true });
        });
        
        // Add followed addresses that aren't in the traders list
        followedTraders.forEach(address => {
            if (!traders.some(t => t.address === address)) {
                result.push({
                    address,
                    followers: 0,
                    totalTrades: 0,
                    profitLoss: "Following",
                    isFollowing: true
                });
            }
        });
        
        return result;
    })();

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
                {/* Migration Banner */}
                {showMigrationBanner && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 text-blue-600">ℹ️</div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900 mb-1">Local Follows Detected</h3>
                                <p className="text-sm text-blue-800 mb-2">
                                    Your follows from before are still here! To make them permanent and enable the agent to monitor them,
                                    please click "Follow" on each trader again to save them to the blockchain.
                                </p>
                                <button
                                    onClick={() => setShowMigrationBanner(false)}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                                {traderSettings[trader.address] && (
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`text-xs ${
                                                            traderSettings[trader.address].autoCopyEnabled 
                                                                ? 'bg-green-50 text-green-700 border-green-200' 
                                                                : 'bg-gray-50 text-gray-700 border-gray-200'
                                                        }`}
                                                    >
                                                        Auto-copy {traderSettings[trader.address].autoCopyEnabled ? 'ON' : 'OFF'}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {traderSettings[trader.address] ? (
                                                    <>
                                                        Copy: {traderSettings[trader.address].copyPercentage}% of position size • 
                                                        Max: {(parseInt(traderSettings[trader.address].maxTradeSize) / 1_000_000_000).toFixed(2)} SUI
                                                    </>
                                                ) : (
                                                    'Loading settings...'
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleOpenSettings(trader.address)}
                                            >
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
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Settings Modal */}
            {settingsModalOpen && selectedTrader && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Copy Trading Settings</h2>
                            <button
                                onClick={() => setSettingsModalOpen(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="mb-4 p-3 bg-muted rounded-md">
                            <div className="text-sm text-muted-foreground mb-1">Trader Address</div>
                            <div className="font-mono text-sm">{formatAddress(selectedTrader)}</div>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Auto-copy toggle */}
                            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                                <div>
                                    <div className="font-medium">Auto-copy Trades</div>
                                    <div className="text-sm text-muted-foreground">
                                        Automatically copy this trader's transactions
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSettingsAutoCopyEnabled(!settingsAutoCopyEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        settingsAutoCopyEnabled ? 'bg-green-600' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            settingsAutoCopyEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            
                            {/* Copy percentage */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Copy Percentage
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={settingsCopyPercentage}
                                        onChange={(e) => setSettingsCopyPercentage(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                        className="flex-1"
                                    />
                                    <span className="text-sm text-muted-foreground">%</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Copy {settingsCopyPercentage}% of each trade's position size
                                </div>
                            </div>
                            
                            {/* Max trade size */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Max Trade Size (SUI)
                                </label>
                                <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={(parseInt(settingsMaxTradeSize) / 1_000_000_000).toFixed(2)}
                                    onChange={(e) => {
                                        const sui = parseFloat(e.target.value) || 0.1;
                                        setSettingsMaxTradeSize(Math.floor(sui * 1_000_000_000).toString());
                                    }}
                                />
                                <div className="text-xs text-muted-foreground mt-1">
                                    Maximum SUI amount per copied trade
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mt-6">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setSettingsModalOpen(false)}
                                disabled={isUpdatingSettings}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleUpdateSettings}
                                disabled={isUpdatingSettings}
                            >
                                {isUpdatingSettings ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Settings'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

