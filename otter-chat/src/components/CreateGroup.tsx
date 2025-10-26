import { useState } from "react";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Card, Flex, TextField, Select, Text, Heading } from "@radix-ui/themes";

export function CreateGroup({
    onCreated,
}: {
    onCreated: (id: string) => void;
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
                    // Extract community ID from the result and call onCreated
                    // This would need to be adjusted based on the actual return structure
                    onCreated(result.digest);
                },
                onError: (error) => {
                    console.error("Failed to create community:", error);
                },
            }
        );
    };

    return (
        <Card size="3" style={{ maxWidth: 500, margin: "0 auto" }}>
            <Heading size="4" mb="4">Create New Community</Heading>
            
            <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="3">
                    {/* Community Name */}
                    <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">Community Name</Text>
                        <TextField.Root
                            placeholder="Enter community name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            color={errors.name ? "red" : undefined}
                        />
                        {errors.name && (
                            <Text size="1" color="red">{errors.name}</Text>
                        )}
                    </Flex>

                    {/* Community Description */}
                    <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">Description</Text>
                        <TextField.Root
                            placeholder="Describe your community"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            color={errors.description ? "red" : undefined}
                        />
                        {errors.description && (
                            <Text size="1" color="red">{errors.description}</Text>
                        )}
                    </Flex>

                    {/* Community Type */}
                    <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">Type</Text>
                        <Select.Root
                            value={type}
                            onValueChange={(value: "free" | "paid") => setType(value)}
                        >
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="free">Free</Select.Item>
                                <Select.Item value="paid">Paid</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Flex>

                    {/* Price (only for paid communities) */}
                    {type === "paid" && (
                        <Flex direction="column" gap="1">
                            <Text size="2" weight="medium">Cost (SUI)</Text>
                            <TextField.Root
                                type="number"
                                placeholder="0.1"
                                value={price}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow empty string, numbers, and one decimal point
                                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                        setPrice(value);
                                    }
                                }}
                                color={errors.price ? "red" : undefined}
                                min="0.01"
                                max="1000"
                                step="0.01"
                            />
                            {errors.price && (
                                <Text size="1" color="red">{errors.price}</Text>
                            )}
                            {price && !errors.price && (
                                <Text size="1" color="gray">
                                    Entry fee: {formatPrice(price)} SUI
                                </Text>
                            )}
                        </Flex>
                    )}

                    {/* Max Members */}
                    <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">Max Members</Text>
                        <TextField.Root
                            type="number"
                            placeholder="50"
                            value={maxMembers}
                            onChange={(e) => setMaxMembers(parseInt(e.target.value) || 50)}
                            color={errors.maxMembers ? "red" : undefined}
                            min="3"
                            max="1000"
                        />
                        {errors.maxMembers && (
                            <Text size="1" color="red">{errors.maxMembers}</Text>
                        )}
                    </Flex>

                    {/* Submit Button */}
                    <Button 
                        type="submit" 
                        disabled={isPending || !currentAccount}
                        loading={isPending}
                        size="3"
                    >
                        {isPending ? "Creating..." : "Create Community"}
                    </Button>

                    {!currentAccount && (
                        <Text size="2" color="red" align="center">
                            Please connect your wallet to create a community
                        </Text>
                    )}
                </Flex>
            </form>
        </Card>
    );
}



    
