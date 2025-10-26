import { useState } from "react";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus } from "lucide-react";

export function CreateGroup({
    onCreated,
    onCancel,
}: {
    onCreated: (id: string) => void;
    onCancel?: () => void;
}) {
    const currentAccount = useCurrentAccount();
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"free" | "paid" | "dao">("free");
    const [maxMembers, setMaxMembers] = useState(50);
    const [tokenThreshold, setTokenThreshold] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const {
        mutate: signAndExecute,
        isPending,
    } = useSignAndExecuteTransaction();

    // Registry object ID for the community contract
    const registryId = '0x5e6a59cad716ddedd7327a18c5d180e7ceed98fd613422987d313924d0b31916';

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = "Community name is required";
        }

        if (!description.trim()) {
            newErrors.description = "Community description is required";
        }

        if (type === "paid") {
            if (!price.trim()) {
                newErrors.price = "Price is required for paid groups";
            } else {
                const priceValue = parseFloat(price);
                if (isNaN(priceValue) || priceValue < 0.01 || priceValue > 1000) {
                    newErrors.price = "Price must be between 0.01 and 1000 SUI";
                }
            }
        }

        if (type === "dao") {
            if (!tokenThreshold.trim()) {
                newErrors.tokenThreshold = "Token threshold is required for DAO communities";
            } else {
                const thresholdValue = parseFloat(tokenThreshold);
                if (isNaN(thresholdValue) || thresholdValue < 0.01 || thresholdValue > 1000000) {
                    newErrors.tokenThreshold = "Token threshold must be between 0.01 and 1,000,000 SUI";
                }
            }
        }

        if (maxMembers < 3 || maxMembers > 1000) {
            newErrors.maxMembers = "Max members must be between 3 and 1000";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Helper function to format price display
    const formatPrice = (priceStr: string): string => {
        const priceValue = parseFloat(priceStr);
        if (isNaN(priceValue)) return "";
        return priceValue.toFixed(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !currentAccount) {
            return;
        }

        const tx = new Transaction();

        if (type === "dao") {
            // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
            const thresholdInMist = Math.floor(parseFloat(tokenThreshold) * 1_000_000_000);

            tx.moveCall({
                package: '0x525a9ee83a400d5a95c79ad0bc9f09a7bc6a0d15eecac2caa999c693b8db50a2',
                module: 'community',
                function: 'create_dao_community',
                arguments: [
                    tx.object(registryId),
                    tx.pure.string(name),
                    tx.pure.string(description),
                    tx.pure.string("0x2::sui::SUI"), // SUI token type
                    tx.pure.u64(thresholdInMist),
                    tx.pure.u64(maxMembers),
                ],
            });
        } else {
            // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
            const priceInMist = type === 'free' ? 0 : Math.floor(parseFloat(price) * 1_000_000_000);

            tx.moveCall({
                package: '0x525a9ee83a400d5a95c79ad0bc9f09a7bc6a0d15eecac2caa999c693b8db50a2',
                module: 'community',
                function: 'create_community',
                arguments: [
                    tx.object(registryId),
                    tx.pure.string(name),
                    tx.pure.string(description),
                    tx.pure.u64(priceInMist),
                    tx.pure.u64(maxMembers),
                ],
            });
        }

        signAndExecute(
            {
                transaction: tx,
            },
            {
                onSuccess: (result) => {
                    console.log("Community created successfully:", result);
                    onCreated(result.digest);
                },
                onError: (error) => {
                    console.error("Failed to create community:", error);
                },
            }
        );
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create New Community
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Community Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Community Name</Label>
                        <Input
                            id="name"
                            placeholder="Enter community name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && (
                            <Alert variant="destructive">
                                <AlertDescription>{errors.name}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Community Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe your community"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={errors.description ? "border-destructive" : ""}
                            rows={3}
                        />
                        {errors.description && (
                            <Alert variant="destructive">
                                <AlertDescription>{errors.description}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Community Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={type} onValueChange={(value: "free" | "paid" | "dao") => setType(value)}>
                            <SelectTrigger className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                                <SelectItem value="free" className="bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800">Free</SelectItem>
                                <SelectItem value="paid" className="bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800">Paid</SelectItem>
                                <SelectItem value="dao" className="bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800">DAO (Token-Gated)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Price (only for paid groups) */}
                    {type === "paid" && (
                        <div className="space-y-2">
                            <Label htmlFor="price">Cost (SUI)</Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="0.1"
                                value={price}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const value = e.target.value;
                                    // Allow empty string, numbers, and one decimal point
                                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                        setPrice(value);
                                    }
                                }}
                                className={errors.price ? "border-destructive" : ""}
                                min="0.01"
                                max="1000"
                                step="0.01"
                            />
                            {errors.price && (
                                <Alert variant="destructive">
                                    <AlertDescription>{errors.price}</AlertDescription>
                                </Alert>
                            )}
                            {price && !errors.price && (
                                <p className="text-sm text-muted-foreground">
                                    Entry fee: {formatPrice(price)} SUI
                                </p>
                            )}
                        </div>
                    )}

                    {/* Token Threshold (only for DAO groups) */}
                    {type === "dao" && (
                        <div className="space-y-2">
                            <Label htmlFor="tokenThreshold">Minimum SUI Required</Label>
                            <Input
                                id="tokenThreshold"
                                type="number"
                                placeholder="100"
                                value={tokenThreshold}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const value = e.target.value;
                                    // Allow empty string, numbers, and one decimal point
                                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                        setTokenThreshold(value);
                                    }
                                }}
                                className={errors.tokenThreshold ? "border-destructive" : ""}
                                min="0.01"
                                max="1000000"
                                step="0.01"
                            />
                            {errors.tokenThreshold && (
                                <Alert variant="destructive">
                                    <AlertDescription>{errors.tokenThreshold}</AlertDescription>
                                </Alert>
                            )}
                            {tokenThreshold && !errors.tokenThreshold && (
                                <p className="text-sm text-muted-foreground">
                                    Users need at least {formatPrice(tokenThreshold)} SUI to join
                                </p>
                            )}
                        </div>
                    )}

                    {/* Max Members */}
                    <div className="space-y-2">
                        <Label htmlFor="maxMembers">Max Members</Label>
                        <Input
                            id="maxMembers"
                            type="number"
                            placeholder="50"
                            value={maxMembers}
                            onChange={(e) => setMaxMembers(parseInt(e.target.value) || 50)}
                            className={errors.maxMembers ? "border-destructive" : ""}
                            min="3"
                            max="1000"
                        />
                        {errors.maxMembers && (
                            <Alert variant="destructive">
                                <AlertDescription>{errors.maxMembers}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            disabled={isPending || !currentAccount}
                            className="flex-1"
                            variant="outline"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Community"
                            )}
                        </Button>
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                    </div>

                    {!currentAccount && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                Please connect your wallet to create a community
                            </AlertDescription>
                        </Alert>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
