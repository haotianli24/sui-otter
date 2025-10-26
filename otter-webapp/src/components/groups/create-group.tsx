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
    const [type, setType] = useState<"free" | "paid">("free");
    const [maxMembers, setMaxMembers] = useState(50);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const {
        mutate: signAndExecute,
        isPending,
    } = useSignAndExecuteTransaction();

    // Registry object ID for the community contract
    const registryId = '0xb1fbb77cfcc1a39ca5ca7a4f1888302a5e7affdef04e9c3a2994e84659f4160c';

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
                newErrors.price = "Price is required for paid communities";
            } else {
                const priceValue = parseFloat(price);
                if (isNaN(priceValue) || priceValue < 0.01 || priceValue > 1000) {
                    newErrors.price = "Price must be between 0.01 and 1000 SUI";
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

        // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
        const priceInMist = type === 'free' ? 0 : Math.floor(parseFloat(price) * 1_000_000_000);

        tx.moveCall({
            package: '0x7de4958f7ba9d65318f2ab9a08ecbc51d103f9eac9030ffca517e5b0bf5b69ed',
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
                        <Select value={type} onValueChange={(value: "free" | "paid") => setType(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Price (only for paid communities) */}
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
