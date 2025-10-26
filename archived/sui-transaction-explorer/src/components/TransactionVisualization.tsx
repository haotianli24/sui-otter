'use client';

import { ArrowRight, User, Package, Coins } from 'lucide-react';
import ExpandableText from './ExpandableText';

interface TransactionVisualizationProps {
    participants: string[];
    operations: Array<{
        type: 'transfer' | 'create' | 'mutate' | 'delete' | 'call' | 'publish';
        from?: string;
        to?: string;
        amount?: string;
        asset?: string;
        description: string;
    }>;
}

export default function TransactionVisualization({
    participants,
    operations
}: TransactionVisualizationProps) {
    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getParticipantType = (address: string) => {
        const hasOutgoing = operations.some(op => op.from === address);
        const hasIncoming = operations.some(op => op.to === address);

        if (hasOutgoing && hasIncoming) return 'participant';
        if (hasOutgoing) return 'sender';
        if (hasIncoming) return 'recipient';
        return 'participant';
    };

    const transfers = operations.filter(op => op.type === 'transfer' && op.from && op.to);

    return (
        <div className="space-y-6">
            {/* Participants */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Participants</h3>
                <div className="flex flex-wrap gap-3">
                    {participants.map((participant, index) => {
                        const type = getParticipantType(participant);
                        const icon = type === 'sender' ? User : type === 'recipient' ? Package : Coins;
                        const color = type === 'sender' ? 'bg-red-100 text-red-700' :
                            type === 'recipient' ? 'bg-green-100 text-green-700' :
                                'bg-blue-100 text-blue-700';

                        const IconComponent = icon;

                        return (
                            <div
                                key={index}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${color}`}
                            >
                                <IconComponent className="h-4 w-4" />
                                <ExpandableText
                                    text={participant}
                                    type="address"
                                    shortLength={6}
                                    className="text-sm"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Asset Flows */}
            {transfers.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Asset Flows</h3>
                    <div className="space-y-3">
                        {transfers.map((transfer, index) => (
                            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                        <User className="h-4 w-4 text-red-600" />
                                    </div>
                                    <div>
                                        <ExpandableText
                                            text={transfer.from!}
                                            type="address"
                                            shortLength={6}
                                            className="text-sm block"
                                        />
                                        <span className="text-xs text-gray-500">Sender</span>
                                    </div>
                                </div>

                                <div className="flex-1 flex items-center justify-center min-w-0">
                                    <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border max-w-full">
                                        <ArrowRight className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                        {transfer.amount && (
                                            <span className="text-sm font-semibold text-blue-600 truncate">
                                                {transfer.amount} {transfer.asset || 'SUI'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <div>
                                        <ExpandableText
                                            text={transfer.to!}
                                            type="address"
                                            shortLength={6}
                                            className="text-sm block"
                                        />
                                        <span className="text-xs text-gray-500">Recipient</span>
                                    </div>
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <Package className="h-4 w-4 text-green-600" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Operations Summary */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Operation Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['transfer', 'create', 'mutate', 'call'].map((type) => {
                        const count = operations.filter(op => op.type === type).length;
                        const colors = {
                            transfer: 'bg-blue-100 text-blue-700',
                            create: 'bg-green-100 text-green-700',
                            mutate: 'bg-yellow-100 text-yellow-700',
                            call: 'bg-purple-100 text-purple-700',
                        };

                        return (
                            <div
                                key={type}
                                className={`p-3 rounded-lg text-center ${colors[type as keyof typeof colors]}`}
                            >
                                <div className="font-semibold capitalize">{type}</div>
                                <div className="text-2xl font-bold">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
