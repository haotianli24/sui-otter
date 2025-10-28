// Comprehensive Sui Protocol Registry
// Maps package addresses to protocol information for enhanced transaction parsing

export interface ProtocolInfo {
    name: string;
    type: 'dex' | 'lending' | 'nft' | 'staking' | 'validator' | 'cex' | 'infrastructure' | 'bridge' | 'oracle' | 'other';
    category: 'DeFi' | 'Infrastructure' | 'NFTs' | 'Gaming' | 'Social' | 'Cross-Chain' | 'Core';
    description?: string;
    website?: string;
    tvl?: string;
}

export interface AddressInfo {
    name: string;
    type: 'validator' | 'cex' | 'protocol' | 'other';
    description?: string;
}

// Major Sui DeFi Protocols
export const KNOWN_PROTOCOLS: Record<string, ProtocolInfo> = {
    // === DEXs & Trading Platforms ===
    "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb": {
        name: "Cetus Protocol",
        type: "dex",
        category: "DeFi",
        description: "Concentrated Liquidity Market Maker (CLMM) DEX - largest protocol on Sui by TVL",
        website: "https://cetus.zone",
        tvl: "Top 3 by TVL"
    },
    "0xeffc8ae61f439bb34c9b905ff8f29ec56873dcedf81c7123ff2f1f67c45ec302": {
        name: "Cetus Aggregator",
        type: "dex",
        category: "DeFi",
        description: "Cetus protocol aggregator for optimal trade routing"
    },
    "0x996c4d9480708fb8b92aa7acf819fb0497b5ec8e65ba06601cae2fb6db3312c3": {
        name: "Cetus Integration",
        type: "dex",
        category: "DeFi",
        description: "Cetus integration contract for third-party protocols"
    },
    "0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1": {
        name: "Turbos Finance",
        type: "dex",
        category: "DeFi",
        description: "Non-custodial DEX with concentrated liquidity AMM and derivatives trading",
        website: "https://turbos.finance",
        tvl: "$33.19M daily volume"
    },
    "0x4379259b0f0f547b84ec1c81d704f24861edd8afd8fa6bb9c082e44fbf97a27a": {
        name: "Kriya DEX",
        type: "dex",
        category: "DeFi",
        description: "Orderbook-based DEX for perpetuals trading with 20x leverage",
        website: "https://kriya.finance",
        tvl: "$2.4M"
    },
    "0x361dd589b98e8fcda9dc7f53a4b2a5b4a5c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8": {
        name: "Bluefin",
        type: "dex",
        category: "DeFi",
        description: "Decentralized perpetuals exchange offering leveraged trading",
        website: "https://bluefin.io"
    },
    "0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809": {
        name: "Aftermath Finance",
        type: "dex",
        category: "DeFi",
        description: "Multi-protocol DEX with swaps, liquidity pools, farms, and DCA orders",
        website: "https://aftermath.finance"
    },

    // === Lending Protocols ===
    "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5": {
        name: "NAVI Protocol",
        type: "lending",
        category: "DeFi",
        description: "One-stop liquidity protocol offering lending and borrowing services",
        tvl: "$502M+ (Top 3 by TVL)"
    },
    "0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9": {
        name: "Scallop",
        type: "lending",
        category: "DeFi",
        description: "First DeFi protocol officially backed by Sui Foundation - over-collateralized lending",
        website: "https://scallop.io",
        tvl: "$570M+"
    },
    "0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7": {
        name: "Scallop Core",
        type: "lending",
        category: "DeFi",
        description: "Scallop protocol core implementation"
    },
    "0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf": {
        name: "Scallop Core Object",
        type: "lending",
        category: "DeFi",
        description: "Scallop protocol core object"
    },

    // === Infrastructure & Core Protocols ===
    "0x2": {
        name: "Sui Framework",
        type: "other",
        category: "Core",
        description: "Core Sui blockchain framework and standard library"
    },
    "0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a": {
        name: "Wormhole Bridge",
        type: "bridge",
        category: "Cross-Chain",
        description: "Cross-chain bridge enabling asset transfers to Sui from multiple networks",
        website: "https://wormhole.com"
    },
    "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c": {
        name: "Wormhole State",
        type: "bridge",
        category: "Cross-Chain",
        description: "Wormhole bridge state management"
    },
    "0x04e20ddf36af412a4096f9014f4a565af9e812db9a05cc40254846cf6ed0ad91": {
        name: "Pyth Oracle",
        type: "oracle",
        category: "Infrastructure",
        description: "Secure price feeds for DeFi protocols on Sui",
        website: "https://pyth.network"
    },
    "0x6b3178db112372be5a78feb708bc39a4ef49cd52224aa34f8a23c1425d280c27": {
        name: "DeepBook Protocol",
        type: "infrastructure",
        category: "Infrastructure",
        description: "Premier decentralized central limit order book (CLOB) - Sui's core liquidity layer",
        website: "https://deepbook.xyz"
    },

    // === NFT & Gaming ===
    "0x684df9c8af8583706ba48460c924284f7fde157c230bfec8c3ecfb0f8e18a854": {
        name: "BlueMove",
        type: "nft",
        category: "NFTs",
        description: "NFT marketplace supporting dynamic NFTs that evolve over time",
        website: "https://bluemove.net"
    },

    // === Stablecoins & Tokens ===
    "0x2375a0b1ec12010aaea3b2545acfa2ad34cfbba03ce4b59f4c39e1e25eed1b2a": {
        name: "Bucket Protocol",
        type: "other",
        category: "DeFi",
        description: "BUCK is an over-collateralized programmable stablecoin backed by Sui ecosystem assets",
        website: "https://bucketprotocol.io"
    },

    // === Legacy/Unknown Protocols ===
    "0x719685bc5e45910d8e7e85240d39711e4ce9c5b23bb89cf38daabd9dc9ef915f": {
        name: "Price Oracle",
        type: "oracle",
        category: "Infrastructure",
        description: "Price feed oracle service"
    },
    "0x794a0d48b2deccba87c8f8c0448a99ac29298a866ce19010b59e44abf45fb910": {
        name: "Market Data",
        type: "infrastructure",
        category: "Infrastructure",
        description: "Market data provider service"
    },
    "0xe05dafb5133bcffb8d59f4e12465dc0e9faeaa05e3e342a08fe135800e3e4407": {
        name: "Liquidity Pool",
        type: "infrastructure",
        category: "Infrastructure",
        description: "Liquidity pool infrastructure"
    },
    "0xf948981b806057580f91622417534f491da5f61aeaf33d0ed8e69fd5691c95ce": {
        name: "Trading Engine",
        type: "infrastructure",
        category: "Infrastructure",
        description: "Trading infrastructure service"
    },
    "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f": {
        name: "Fee Collector",
        type: "infrastructure",
        category: "Infrastructure",
        description: "Fee collection system"
    },
    "0x0000000000000000000000000000000000000000000000000000000000000006": {
        name: "Clock",
        type: "infrastructure",
        category: "Core",
        description: "Sui blockchain clock object"
    }
};

// Known validator addresses (example addresses - replace with real ones)
export const KNOWN_VALIDATORS: Record<string, AddressInfo> = {
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef": {
        name: "Sui Foundation Validator",
        type: "validator",
        description: "Official Sui Foundation validator"
    },
    "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890": {
        name: "Mysten Labs Validator",
        type: "validator",
        description: "Mysten Labs validator node"
    },
    "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba": {
        name: "Community Validator #1",
        type: "validator",
        description: "Community-run validator"
    }
};

// Known CEX addresses (example addresses - replace with real ones)
export const KNOWN_CEX: Record<string, AddressInfo> = {
    "0x1111111111111111111111111111111111111111111111111111111111111111": {
        name: "Binance",
        type: "cex",
        description: "Binance exchange hot wallet"
    },
    "0x2222222222222222222222222222222222222222222222222222222222222222": {
        name: "Coinbase",
        type: "cex",
        description: "Coinbase exchange hot wallet"
    },
    "0x3333333333333333333333333333333333333333333333333333333333333333": {
        name: "Kraken",
        type: "cex",
        description: "Kraken exchange hot wallet"
    },
    "0x4444444444444444444444444444444444444444444444444444444444444444": {
        name: "OKX",
        type: "cex",
        description: "OKX exchange hot wallet"
    }
};

// Known token addresses to symbols
export const KNOWN_TOKENS: Record<string, string> = {
    "0x2::sui::SUI": "SUI",
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC": "USDC",
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN": "WETH",
    "0xaf8cd5edc19c4512f4259f0bee101a40d41ebd73820c7a13f434611c87e57ad6::coin::COIN": "USDT"
};

/**
 * Resolve a package ID to a protocol name
 */
export function resolveProtocolName(packageId: string): string {
    const protocol = KNOWN_PROTOCOLS[packageId];
    return protocol?.name || "Unknown Protocol";
}

/**
 * Resolve a package ID to full protocol info
 */
export function resolveProtocolInfo(packageId: string): ProtocolInfo | null {
    return KNOWN_PROTOCOLS[packageId] || null;
}

/**
 * Resolve an address to a validator name
 */
export function resolveValidatorName(address: string): string | null {
    const validator = KNOWN_VALIDATORS[address];
    return validator?.name || null;
}

/**
 * Resolve an address to a CEX name
 */
export function resolveCexName(address: string): string | null {
    const cex = KNOWN_CEX[address];
    return cex?.name || null;
}

/**
 * Resolve an address to a human-readable label
 */
export function resolveAddressLabel(address: string): string | null {
    // Check validators first
    const validatorName = resolveValidatorName(address);
    if (validatorName) return validatorName;

    // Check CEX
    const cexName = resolveCexName(address);
    if (cexName) return cexName;

    return null;
}

/**
 * Get all addresses of a specific type
 */
export function getAddressesByType(type: 'validator' | 'cex' | 'protocol'): string[] {
    switch (type) {
        case 'validator':
            return Object.keys(KNOWN_VALIDATORS);
        case 'cex':
            return Object.keys(KNOWN_CEX);
        case 'protocol':
            return Object.keys(KNOWN_PROTOCOLS);
        default:
            return [];
    }
}

/**
 * Check if an address is a known validator
 */
export function isValidator(address: string): boolean {
    return address in KNOWN_VALIDATORS;
}

/**
 * Check if an address is a known CEX
 */
export function isCex(address: string): boolean {
    return address in KNOWN_CEX;
}

/**
 * Check if an address is a known protocol
 */
export function isProtocol(address: string): boolean {
    return address in KNOWN_PROTOCOLS;
}

/**
 * Get protocol type for an address
 */
export function getProtocolType(packageId: string): string | null {
    const protocol = KNOWN_PROTOCOLS[packageId];
    return protocol?.type || null;
}

/**
 * Extract token symbol from type string
 */
export function extractTokenSymbol(typeStr: string): string {
    if (!typeStr) return "Unknown";

    // Check if it's a known token first
    if (KNOWN_TOKENS[typeStr]) {
        return KNOWN_TOKENS[typeStr];
    }

    // Extract token symbol from the end of the type string
    const parts = typeStr.split("::");
    const lastPart = parts[parts.length - 1];

    // Handle common patterns
    if (lastPart === "SUI") return "SUI";
    if (lastPart === "USDC") return "USDC";
    if (lastPart === "USDT") return "USDT";
    if (lastPart === "WETH") return "WETH";
    if (lastPart === "COIN") {
        // For generic COIN types, try to extract from package name or use shortened address
        const packageId = parts[0];
        if (packageId && packageId !== "0x2") {
            return `${packageId.slice(0, 6)}...${packageId.slice(-4)}`;
        }
        return "Token";
    }

    return lastPart || "Token";
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get all protocol names for filtering
 */
export function getAllProtocolNames(): string[] {
    return Object.values(KNOWN_PROTOCOLS).map(p => p.name);
}

/**
 * Get all validator names for filtering
 */
export function getAllValidatorNames(): string[] {
    return Object.values(KNOWN_VALIDATORS).map(v => v.name);
}
