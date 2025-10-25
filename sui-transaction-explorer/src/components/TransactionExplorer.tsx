'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ArrowRight, Coins, Users, Activity, Copy, Check } from 'lucide-react';
import TransactionVisualization from './TransactionVisualization';
import ExpandableText from './ExpandableText';
import Link from 'next/link';

interface TransactionDetails {
    digest: string;
    gasUsed: string;
    participants: string[];
    operations: {
        type: 'transfer' | 'create' | 'mutate' | 'delete' | 'call' | 'publish';
        from?: string;
        to?: string;
        amount?: string;
        asset?: string;
        description: string;
    }[];
    moveCalls: {
        package: string;
        module: string;
        function: string;
        arguments: string[];
    }[];
    timestamp: string;
}

export default function TransactionExplorer() {
    const searchParams = useSearchParams();
    const [transactionHash, setTransactionHash] = useState('');
    const [loading, setLoading] = useState(false);
    const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [recentTxs, setRecentTxs] = useState<any[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [loadingRecent, setLoadingRecent] = useState(false);

    useEffect(() => {
        const txParam = searchParams.get('tx');
        if (txParam) {
            setTransactionHash(txParam);
            setTimeout(() => {
                const form = document.querySelector('form');
                if (form) {
                    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
            }, 100);
        }
    }, [searchParams]);

    const fetchRecentTransactions = async () => {
        console.log('Fetching recent transactions...');
        setLoadingRecent(true);
        try {
            const response = await fetch('/api/recent-transactions');
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            const data = await response.json();
            console.log('Received transactions:', data.length);
            setRecentTxs(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoadingRecent(false);
        }
    };

    const copyToClipboard = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transactionHash.trim()) return;

        setLoading(true);
        setError(null);
        setTransactionDetails(null);

        try {
            const response = await fetch('/api/transaction-explorer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ digest: transactionHash.trim() }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch transaction details');
            }

            const data = await response.json();
            setTransactionDetails(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatAddressLong = (addr: string) => {
        return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
    };

    // Function to parse addresses from description text and replace with ExpandableText
    const parseDescriptionWithAddresses = (description: string) => {
        // Regular expression to match shortened addresses like "0x0feb...ebb3"
        const addressRegex = /(0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4})/g;

        const parts = description.split(addressRegex);

        return (
            <>
                {parts.map((part, index) => {
                    if (addressRegex.test(part)) {
                        // This is an address, wrap it in ExpandableText
                        return (
                            <ExpandableText
                                key={index}
                                text={part}
                                type="address"
                                shortLength={6}
                                className="text-blue-600 hover:text-blue-800"
                            />
                        );
                    }
                    return <span key={index}>{part}</span>;
                })}
            </>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-6">
            <div className="text-center space-y-6">
                <div>
                    <h1 className="text-4xl font-semibold text-gray-900 mb-4">Sui Transaction Explorer</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Analyze any Sui transaction to understand what happened in plain language
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Main Explorer */}
                <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="transaction-hash" className="block text-sm font-medium text-gray-700 mb-2">
                                    Transaction Hash
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        id="transaction-hash"
                                        type="text"
                                        value={transactionHash}
                                        onChange={(e) => setTransactionHash(e.target.value)}
                                        placeholder="Enter transaction hash"
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !transactionHash.trim()}
                                        className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                                    >
                                        {loading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                        {loading ? 'Analyzing...' : 'Analyze'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    {transactionDetails && (
                        <div className="space-y-6">
                            {/* Transaction Summary */}
                            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                                    Transaction Overview
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="flex items-center space-x-2">
                                        <Coins className="h-5 w-5 text-gray-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Gas Used</p>
                                            <p className="font-semibold">{transactionDetails.gasUsed} SUI</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Users className="h-5 w-5 text-gray-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Participants</p>
                                            <p className="font-semibold">{transactionDetails.participants.length}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Activity className="h-5 w-5 text-gray-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Operations</p>
                                            <p className="font-semibold">{transactionDetails.operations.length}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t pt-4">
                                    <p className="text-sm text-gray-600 mb-2">Address Colors:</p>
                                    <div className="flex flex-wrap gap-4 text-xs">
                                        <div className="flex items-center space-x-1">
                                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                                            <span>Sender addresses</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                            <span>Recipient addresses</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <div className="w-3 h-3 bg-gray-500 rounded"></div>
                                            <span>Other participants</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Operations */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                                    Transaction Details
                                </h2>
                                <p className="text-gray-600 mb-6 text-sm">
                                    Step-by-step breakdown of what occurred in this transaction:
                                </p>
                                <div className="space-y-3">
                                    {transactionDetails.operations.map((op, index) => (
                                        <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex-shrink-0 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-semibold text-white">{index + 1}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium break-words text-base leading-relaxed text-gray-800">
                                                    {parseDescriptionWithAddresses(op.description)}
                                                </div>
                                                {op.from && op.to && (
                                                    <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600 bg-white px-3 py-1 rounded border">
                                                        <div className="flex items-center space-x-1">
                                                            <span className="text-xs text-gray-500">From:</span>
                                                            <ExpandableText text={op.from} type="address" shortLength={6} />
                                                        </div>
                                                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                                        <div className="flex items-center space-x-1">
                                                            <span className="text-xs text-gray-500">To:</span>
                                                            <ExpandableText text={op.to} type="address" shortLength={6} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Move Calls */}
                            {transactionDetails.moveCalls.length > 0 && (
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-xl font-semibold mb-4 text-gray-900">
                                        Smart Contract Functions
                                    </h2>
                                    <p className="text-gray-600 mb-4 text-sm">
                                        This transaction executed the following smart contract functions:
                                    </p>
                                    <div className="space-y-3">
                                        {transactionDetails.moveCalls.map((call, index) => (
                                            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                                                        <span className="text-xs font-semibold text-white">{index + 1}</span>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-800">Function Call</span>
                                                </div>
                                                <div className="font-mono text-sm break-all bg-white p-3 rounded border">
                                                    <ExpandableText
                                                        text={call.module}
                                                        type="package"
                                                        shortLength={12}
                                                        className="text-blue-600 font-semibold"
                                                    />
                                                    <span className="text-gray-400 mx-1">::</span>
                                                    <span className="text-green-600 font-semibold">{call.function}</span>
                                                </div>
                                                {call.arguments.length > 0 && (
                                                    <div className="mt-3">
                                                        <span className="text-sm font-medium text-gray-700">Parameters passed:</span>
                                                        <div className="mt-1 p-3 bg-white rounded border text-xs font-mono break-all">
                                                            {call.arguments.join(', ')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Participants */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <TransactionVisualization
                                    participants={transactionDetails.participants}
                                    operations={transactionDetails.operations}
                                />
                            </div>

                            {/* Explain Another Transaction */}
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6 border border-green-200">
                                <div className="text-center space-y-4">
                                    <h2 className="text-xl font-semibold flex items-center justify-center">
                                        🚀 Ready for Another Transaction?
                                    </h2>
                                    <p className="text-gray-600">
                                        Analyze more transactions to understand what's happening on the Sui blockchain!
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => {
                                                setTransactionHash('');
                                                setTransactionDetails(null);
                                                setError(null);
                                            }}
                                            className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                        >
                                            🔄 Clear & Start New
                                        </button>
                                        <button
                                            onClick={fetchRecentTransactions}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                        >
                                            📋 Get More Examples
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Test Transactions Sidebar */}
                <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900">
                            Try Real Transactions
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Get real Sui transactions from the blockchain to test the explorer with actual data.
                        </p>
                        <button
                            onClick={fetchRecentTransactions}
                            disabled={loadingRecent}
                            className="w-full px-4 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {loadingRecent ? 'Loading...' : 'Fetch Recent Transactions'}
                        </button>
                    </div>

                    {recentTxs.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">
                                Live Transactions ({recentTxs.length})
                            </h3>
                            <p className="text-gray-600 mb-4 text-sm">
                                Click "Test" on any transaction below to analyze it:
                            </p>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {recentTxs.map((tx, index) => (
                                    <div key={tx.digest} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="text-sm text-gray-700 font-medium">
                                                    <ExpandableText
                                                        text={tx.digest}
                                                        type="hash"
                                                        shortLength={8}
                                                        showExplorerLink={true}
                                                    />
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    From: {tx.transaction?.data?.sender && (
                                                        <ExpandableText
                                                            text={tx.transaction.data.sender}
                                                            type="address"
                                                            shortLength={6}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setTransactionHash(tx.digest);
                                                        setTransactionDetails(null);
                                                        setError(null);
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium transition-colors"
                                                >
                                                    🔍 Test
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
