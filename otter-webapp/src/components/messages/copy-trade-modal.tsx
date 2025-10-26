

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Message } from "@/lib/mock-data";
import { TrendingUp, AlertCircle } from "lucide-react";

interface CopyTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    trade: Message["tradeData"];
}

export function CopyTradeModal({ isOpen, onClose, trade }: CopyTradeModalProps) {
    const [amount, setAmount] = useState(trade?.amount || "");
    const [isExecuting, setIsExecuting] = useState(false);

    if (!trade) return null;

    const handleCopyTrade = async () => {
        setIsExecuting(true);
        // Mock trade execution
        await new Promise((resolve) => setTimeout(resolve, 1500));
        alert(
            `Trade executed! ${trade.action.toUpperCase()} ${amount} ${trade.token} at ${trade.price}\n\n(This will connect to your wallet and execute the trade)`
        );
        setIsExecuting(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Copy Trade
                    </DialogTitle>
                    <DialogDescription>
                        Review the trade details before executing
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Trade Summary */}
                    <div className="bg-background border border-border p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Action</span>
                            <span
                                className={`font-semibold ${trade.action === "buy" ? "text-primary" : "text-destructive/70"
                                    }`}
                            >
                                {trade.action.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Token</span>
                            <span className="font-semibold">{trade.token}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Price</span>
                            <span className="font-semibold">{trade.price}</span>
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Amount to {trade.action}
                        </label>
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full h-10 px-4 bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Original amount: {trade.amount} {trade.token}
                        </p>
                    </div>

                    {/* Warning */}
                    <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20">
                        <AlertCircle className="h-4 w-4 text-destructive/70 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">
                                Trading involves risk
                            </p>
                            <p>
                                By copying this trade, you acknowledge that you understand the
                                risks and are making your own investment decision.
                            </p>
                        </div>
                    </div>

                    {/* Estimated Cost */}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Estimated cost:</span>
                        <span className="font-semibold">
                            ~{amount && !isNaN(Number(amount))
                                ? (Number(amount) * Number(trade.price.replace('$', ''))).toFixed(2)
                                : "0.00"} USD
                        </span>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isExecuting}>
                        Cancel
                    </Button>
                    <Button onClick={handleCopyTrade} disabled={isExecuting || !amount}>
                        {isExecuting ? "Executing..." : "Execute Trade"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

