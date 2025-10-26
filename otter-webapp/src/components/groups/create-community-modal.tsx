

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
import { Users } from "lucide-react";

interface CreateCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateCommunityModal({
    isOpen,
    onClose,
}: CreateCommunityModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        type: "free" as "free" | "paid" | "token-gated",
        price: "",
        tokenSymbol: "",
        tokenAmount: "",
    });

    const handleCreate = async () => {
        alert(
            `Community "${formData.name}" created!\n\n` +
            `Type: ${formData.type}\n` +
            `${formData.type === "paid" ? `Price: ${formData.price} SUI/month\n` : ""}` +
            `${formData.type === "token-gated" ? `Required: ${formData.tokenAmount} ${formData.tokenSymbol}\n` : ""}` +
            `\n(This will connect to the smart contract)`
        );
        onClose();
    };

    const isValid =
        formData.name &&
        formData.description &&
        (formData.type === "free" ||
            (formData.type === "paid" && formData.price) ||
            (formData.type === "token-gated" &&
                formData.tokenSymbol &&
                formData.tokenAmount));

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Create New Community
                    </DialogTitle>
                    <DialogDescription>
                        Set up your trading community and invite members
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Name */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Community Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="e.g., Alpha Traders"
                            className="w-full h-10 px-4 bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Description *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="Describe your community and what members can expect..."
                            rows={3}
                            className="w-full px-4 py-3 bg-background border border-input text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Community Type */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Type *</label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                type="button"
                                variant={formData.type === "free" ? "default" : "outline"}
                                onClick={() => setFormData({ ...formData, type: "free" })}
                                size="sm"
                            >
                                Free
                            </Button>
                            <Button
                                type="button"
                                variant={formData.type === "paid" ? "default" : "outline"}
                                onClick={() => setFormData({ ...formData, type: "paid" })}
                                size="sm"
                            >
                                Paid
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    formData.type === "token-gated" ? "default" : "outline"
                                }
                                onClick={() =>
                                    setFormData({ ...formData, type: "token-gated" })
                                }
                                size="sm"
                            >
                                Token Gated
                            </Button>
                        </div>
                    </div>

                    {/* Conditional fields based on type */}
                    {formData.type === "paid" && (
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Monthly Price (SUI) *
                            </label>
                            <input
                                type="text"
                                value={formData.price}
                                onChange={(e) =>
                                    setFormData({ ...formData, price: e.target.value })
                                }
                                placeholder="e.g., 50"
                                className="w-full h-10 px-4 bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    )}

                    {formData.type === "token-gated" && (
                        <>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Token Symbol *
                                </label>
                                <input
                                    type="text"
                                    value={formData.tokenSymbol}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tokenSymbol: e.target.value })
                                    }
                                    placeholder="e.g., SUI"
                                    className="w-full h-10 px-4 bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Minimum Amount *
                                </label>
                                <input
                                    type="text"
                                    value={formData.tokenAmount}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tokenAmount: e.target.value })
                                    }
                                    placeholder="e.g., 10000"
                                    className="w-full h-10 px-4 bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!isValid}>
                        Create Community
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

