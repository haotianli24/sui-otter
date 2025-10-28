// Mock data for the webapp until backend integration

export interface User {
  id: string;
  name: string;
  avatar: string;
  address: string;
  bio?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: "text" | "trade" | "crypto";
  tradeData?: {
    action: "buy" | "sell";
    token: string;
    amount: string;
    price: string;
  };
  cryptoData?: {
    amount: string;
    token: string;
  };
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  avatar?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatar: string;
  owner: User;
  memberCount: number;
  type: "paid" | "free" | "token-gated";
  price?: string;
  tokenRequired?: {
    symbol: string;
    amount: string;
  };
  pnl?: {
    value: string;
    percentage: string;
    positive: boolean;
  };
}

// Mock users
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Alice Chen",
    avatar: "AC",
    address: "0x1234...5678",
    bio: "DeFi trader | 3 years exp",
  },
  {
    id: "2",
    name: "Bob Martinez",
    avatar: "BM",
    address: "0xabcd...efgh",
    bio: "Whale watcher",
  },
  {
    id: "3",
    name: "Charlie Kim",
    avatar: "CK",
    address: "0x9876...5432",
    bio: "NFT collector & trader",
  },
  {
    id: "4",
    name: "Diana Park",
    avatar: "DP",
    address: "0xfedc...ba98",
    bio: "Swing trader | Options expert",
  },
  {
    id: "5",
    name: "Ethan Liu",
    avatar: "EL",
    address: "0x1111...2222",
    bio: "Day trader",
  },
];

// Mock messages
export const mockMessages: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "msg-1",
      senderId: "2",
      content: "Hey! Did you see the latest SUI pump?",
      timestamp: new Date(Date.now() - 3600000),
      type: "text",
    },
    {
      id: "msg-2",
      senderId: "1",
      content: "Yeah, just bought in at $2.10",
      timestamp: new Date(Date.now() - 3500000),
      type: "text",
    },
    {
      id: "msg-3",
      senderId: "2",
      content: "Nice entry! I'm targeting $2.50 for exit",
      timestamp: new Date(Date.now() - 3400000),
      type: "text",
    },
    {
      id: "msg-4",
      senderId: "1",
      content: "0x7a3f9b2c8d4e1a6f5b9c3d8e2a7f4b1c",
      timestamp: new Date(Date.now() - 3300000),
      type: "trade",
      tradeData: {
        action: "buy",
        token: "SUI",
        amount: "500",
        price: "$2.10",
      },
    },
    {
      id: "msg-5",
      senderId: "2",
      content: "Let me send you some gas for the trades",
      timestamp: new Date(Date.now() - 1800000),
      type: "text",
    },
    {
      id: "msg-6",
      senderId: "2",
      content: "/send 10 SUI",
      timestamp: new Date(Date.now() - 1700000),
      type: "crypto",
      cryptoData: {
        amount: "10",
        token: "SUI",
      },
    },
  ],
  "conv-2": [
    {
      id: "msg-7",
      senderId: "3",
      content: "Check out this new NFT drop",
      timestamp: new Date(Date.now() - 7200000),
      type: "text",
    },
    {
      id: "msg-8",
      senderId: "1",
      content: "Looks interesting, what's the mint price?",
      timestamp: new Date(Date.now() - 7100000),
      type: "text",
    },
    {
      id: "msg-9",
      senderId: "3",
      content: "0.5 SUI per NFT, limited to 1000 pieces",
      timestamp: new Date(Date.now() - 7000000),
      type: "text",
    },
  ],
  "conv-3": [
    {
      id: "msg-10",
      senderId: "4",
      content: "Morning! Ready for today's volatility?",
      timestamp: new Date(Date.now() - 14400000),
      type: "text",
    },
  ],
  "group-1": [
    {
      id: "msg-11",
      senderId: "2",
      content: "Welcome to Alpha Traders! 🎯",
      timestamp: new Date(Date.now() - 86400000),
      type: "text",
    },
    {
      id: "msg-12",
      senderId: "4",
      content: "Hey everyone! Excited to learn from the pros",
      timestamp: new Date(Date.now() - 82800000),
      type: "text",
    },
    {
      id: "msg-13",
      senderId: "2",
      content: "Just opened a position on DEEP",
      timestamp: new Date(Date.now() - 72000000),
      type: "text",
    },
    {
      id: "msg-14",
      senderId: "2",
      content: "0x9b4e8f2a1c6d5e3b7a9f4c8d2e1b6a5f",
      timestamp: new Date(Date.now() - 71900000),
      type: "trade",
      tradeData: {
        action: "buy",
        token: "DEEP",
        amount: "10000",
        price: "$0.045",
      },
    },
    {
      id: "msg-15",
      senderId: "5",
      content: "Following this trade! Thanks for sharing",
      timestamp: new Date(Date.now() - 68400000),
      type: "text",
    },
    {
      id: "msg-16",
      senderId: "3",
      content: "What's your target exit?",
      timestamp: new Date(Date.now() - 64800000),
      type: "text",
    },
    {
      id: "msg-17",
      senderId: "2",
      content: "Looking at $0.055-0.060 range for 25% profit",
      timestamp: new Date(Date.now() - 61200000),
      type: "text",
    },
  ],
  "group-2": [
    {
      id: "msg-18",
      senderId: "3",
      content: "Welcome to DeFi Degen Club! This is a free community for learning",
      timestamp: new Date(Date.now() - 172800000),
      type: "text",
    },
    {
      id: "msg-19",
      senderId: "5",
      content: "Thanks for creating this space!",
      timestamp: new Date(Date.now() - 169200000),
      type: "text",
    },
  ],
};

// Mock conversations
export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    type: "direct",
    participants: [mockUsers[1]],
    lastMessage: mockMessages["conv-1"][mockMessages["conv-1"].length - 1],
    unreadCount: 2,
  },
  {
    id: "conv-2",
    type: "direct",
    participants: [mockUsers[2]],
    lastMessage: mockMessages["conv-2"][mockMessages["conv-2"].length - 1],
    unreadCount: 0,
  },
  {
    id: "conv-3",
    type: "direct",
    participants: [mockUsers[3]],
    lastMessage: mockMessages["conv-3"][mockMessages["conv-3"].length - 1],
    unreadCount: 1,
  },
];

// Mock group conversations
export const mockGroupConversations: Conversation[] = [
  {
    id: "group-1",
    type: "group",
    name: "Alpha Traders",
    avatar: "AT",
    participants: [mockUsers[1], mockUsers[3], mockUsers[4]],
    lastMessage: mockMessages["group-1"][mockMessages["group-1"].length - 1],
    unreadCount: 3,
  },
  {
    id: "group-2",
    type: "group",
    name: "DeFi Degen Club",
    avatar: "DD",
    participants: [mockUsers[2], mockUsers[4]],
    lastMessage: mockMessages["group-2"][mockMessages["group-2"].length - 1],
    unreadCount: 0,
  },
];

// Mock groups for discover page
export const mockGroups: Community[] = [
  {
    id: "comm-1",
    name: "Alpha Traders",
    description: "Premium trading signals and analysis for serious traders. Daily market updates and exclusive strategies.",
    avatar: "AT",
    owner: mockUsers[1],
    memberCount: 847,
    type: "paid",
    price: "50 SUI/month",
    pnl: {
      value: "+$127,450",
      percentage: "+34.2%",
      positive: true,
    },
  },
  {
    id: "comm-2",
    name: "DeFi Degen Club",
    description: "Free community for DeFi enthusiasts. Learn, share, and grow together in the decentralized finance space.",
    avatar: "DD",
    owner: mockUsers[2],
    memberCount: 2341,
    type: "free",
    pnl: {
      value: "+$23,100",
      percentage: "+12.5%",
      positive: true,
    },
  },
  {
    id: "comm-3",
    name: "SUI Whales",
    description: "Exclusive club for SUI holders. Must hold 10,000+ SUI to join. High-level discussions and insider info.",
    avatar: "SW",
    owner: mockUsers[3],
    memberCount: 156,
    type: "token-gated",
    tokenRequired: {
      symbol: "SUI",
      amount: "10,000",
    },
    pnl: {
      value: "+$456,890",
      percentage: "+89.3%",
      positive: true,
    },
  },
  {
    id: "comm-4",
    name: "NFT Alpha Hunters",
    description: "Discover the next blue-chip NFT projects before they moon. Early access to mints and flips.",
    avatar: "NH",
    owner: mockUsers[2],
    memberCount: 1523,
    type: "paid",
    price: "25 SUI/month",
    pnl: {
      value: "+$89,234",
      percentage: "+45.7%",
      positive: true,
    },
  },
  {
    id: "comm-5",
    name: "Options Masterclass",
    description: "Advanced options strategies and hedging techniques. For experienced traders only.",
    avatar: "OM",
    owner: mockUsers[3],
    memberCount: 634,
    type: "paid",
    price: "100 SUI/month",
    pnl: {
      value: "+$234,567",
      percentage: "+67.8%",
      positive: true,
    },
  },
  {
    id: "comm-6",
    name: "Crypto Beginners",
    description: "Start your crypto journey here! Free educational content, basic trading tips, and friendly community.",
    avatar: "CB",
    owner: mockUsers[4],
    memberCount: 5678,
    type: "free",
    pnl: {
      value: "+$12,450",
      percentage: "+8.3%",
      positive: true,
    },
  },
  {
    id: "comm-7",
    name: "DEEP Token DAO",
    description: "Official DEEP token community. Governance, proposals, and exclusive airdrops for holders.",
    avatar: "DT",
    owner: mockUsers[1],
    memberCount: 892,
    type: "token-gated",
    tokenRequired: {
      symbol: "DEEP",
      amount: "50,000",
    },
    pnl: {
      value: "+$67,890",
      percentage: "+23.4%",
      positive: true,
    },
  },
  {
    id: "comm-8",
    name: "Yield Farming Pro",
    description: "Maximize your yield farming returns. Best farms, risk analysis, and portfolio optimization.",
    avatar: "YF",
    owner: mockUsers[3],
    memberCount: 1234,
    type: "paid",
    price: "75 SUI/month",
    pnl: {
      value: "+$156,789",
      percentage: "+52.1%",
      positive: true,
    },
  },
  {
    id: "comm-9",
    name: "Meme Coin Madness",
    description: "Ride the meme waves! High risk, high reward plays. Not financial advice, just degen fun.",
    avatar: "MM",
    owner: mockUsers[4],
    memberCount: 3421,
    type: "free",
    pnl: {
      value: "-$5,670",
      percentage: "-3.2%",
      positive: false,
    },
  },
  {
    id: "comm-10",
    name: "Smart Money Moves",
    description: "Follow institutional-grade trading strategies. Data-driven decisions and risk management.",
    avatar: "SM",
    owner: mockUsers[1],
    memberCount: 445,
    type: "paid",
    price: "150 SUI/month",
    pnl: {
      value: "+$389,012",
      percentage: "+78.9%",
      positive: true,
    },
  },
];

// Current user (mock)
export const currentUser: User = mockUsers[0];

