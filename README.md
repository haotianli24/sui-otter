# 🦦 Otter: Decentralized Trading & Community Platform on Sui

**Tagline:** *Swim smarter. Trade together. Own your community.*

---

## 🎯 Overview

Otter is a comprehensive decentralized platform built on the Sui blockchain that combines intelligent trading tools, community-driven DAOs, and AI-powered insights. Whether you're a trader looking to replicate successful strategies, a community builder creating exclusive groups, or an investor seeking real-time blockchain intelligence, Otter provides the tools to navigate and thrive in the Web3 ecosystem.

### Key Features

- **Copy Trading**: Follow and automatically replicate trades from expert traders with customizable settings
- **Community DAOs**: Create and join token-gated communities with governance capabilities
- **AI Agents**: Interact with Fetch.ai-powered AI agents for trading insights and blockchain guidance
- **Real-Time Activity Stream**: Monitor on-chain transactions, swaps, NFT activities, and contract calls
- **Secure Messaging**: End-to-end encrypted messaging for community members and traders
- **User Profiles & Discovery**: Discover traders, communities, and connect with like-minded participants
- **Smart Contract Integration**: Direct blockchain interaction with Sui smart contracts for trading and governance

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - Modern UI framework with hooks
- **TypeScript 5.9** - Type-safe development
- **Vite 7.1** - Lightning-fast build tool
- **Tailwind CSS 4.1** - Utility-first styling
- **React Router 6.30** - Client-side routing

### Blockchain & Web3
- **Sui SDK (@mysten/sui 1.38.0)** - Native Sui blockchain integration
- **Sui dApp Kit (@mysten/dapp-kit 0.18.0)** - Wallet connection & transaction signing
- **Sui Messaging (@mysten/messaging 0.0.2)** - Encrypted messaging protocol
- **Sui Walrus (@mysten/walrus 0.8.1)** - Decentralized storage
- **Sui Seal (@mysten/seal 0.6.0)** - Data integrity verification
- **BCS (@mysten/bcs 1.8.0)** - Binary encoding/decoding

### AI & Data
- **Google GenAI (@google/genai 1.27.0)** - LLM integration for AI agents
- **Fetch.ai Integration** - Autonomous AI agents for trading insights
- **React Query (@tanstack/react-query 5.87.1)** - Server state management

### Backend & Database
- **Node.js API Server** - Custom backend for off-chain operations
- **Supabase (@supabase/supabase-js 2.76.1)** - PostgreSQL database & auth
- **Express.js** - RESTful API framework

### UI & UX
- **Radix UI** - Accessible component primitives
- **Lucide React 0.548** - Beautiful icon library
- **React Markdown 10.1** - Markdown rendering for AI responses
- **Date-fns 4.1** - Date manipulation utilities

### Development Tools
- **TypeScript** - Static type checking
- **Tailwind CSS PostCSS** - Advanced CSS processing
- **Concurrently** - Run multiple processes simultaneously

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- A Sui wallet (Sui Wallet, Martian, or similar)
- Supabase account for database (optional for local dev)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sui-otter/otter-webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_API_SERVER_URL=http://localhost:3001
   ```

4. **Start the development server**
   ```bash
   # Terminal 1: Start the API server
   npm run api
   
   # Terminal 2: Start the frontend dev server
   npm run dev
   ```
   
   Or run both simultaneously:
   ```bash
   npm run dev:full
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

### Build for Production
```bash
npm run build
npm run preview
```

---

## 📱 Core Features & Pages

### 1. **Messages** (`/messages`)
- End-to-end encrypted messaging using Sui Messaging protocol
- Create direct channels with other users
- Real-time message synchronization
- Session key management for security

### 2. **Copy Trading** (`/copy-trading`)
- Browse and follow expert traders
- View trader statistics (followers, total trades, P&L)
- Customize copy settings per trader:
  - Copy percentage allocation
  - Maximum trade size limits
  - Auto-copy toggle
- Track copied trade history
- Blockchain-backed follower relationships

### 3. **Communities & DAOs** (`/groups` & `/discover`)
- Discover token-gated communities
- Create custom DAOs with membership requirements
- Join communities with SUI token threshold
- Preset DAO communities:
  - SUI Test DAO (0.1 SUI minimum)
  - SUI Whales DAO (1000 SUI minimum)
  - SUI Builders DAO (500 SUI minimum)
  - SUI Validators DAO (2000 SUI minimum)
- Community governance and member management

### 4. **AI Agents** (`/agents`)
- **Otter AI Chat**: Powered by ASI:One (Fetch.ai)
- Natural language understanding for blockchain queries
- Real-time insights on:
  - Trading strategies
  - Community recommendations
  - NFT analysis
  - Network activity
- Expert guidance on Sui ecosystem

### 5. **Activity Stream** (`/stream`)
- Real-time transaction monitoring
- Filter by activity type:
  - Transfers (incoming/outgoing)
  - Swaps
  - NFT activities
  - Smart contract calls
- Time range filtering (hour, day, week, all-time)
- Live polling for new transactions
- Pagination for historical data

### 6. **Profile** (`/profile`)
- User profile management
- Trading statistics and history
- Community memberships
- Follower/following relationships
- Customizable profile information

### 7. **Settings** (`/settings`)
- Wallet management
- Theme preferences (light/dark/system)
- Notification settings
- Privacy controls
- Account preferences

---

## 🏗️ Architecture

### Smart Contracts (Move)
Located in `/move` directory:
- **Copy Trading Module**: Manages trader follows and trade replication
- **Community Module**: DAO creation, membership, and governance
- **Messaging Module**: Encrypted message channels

### Key Hooks
- `useTransactionPolling` - Real-time activity stream updates
- `useUserGroups` - Community data fetching
- `useMessaging` - Messaging context and operations
- `useSignAndExecuteTransaction` - Blockchain transaction execution

### API Server
- RESTful endpoints for off-chain operations
- Supabase integration for user data
- Transaction history aggregation
- Community management

---

## 🔐 Security Features

- **Wallet Integration**: Secure Sui wallet connection via dApp Kit
- **Session Keys**: Encrypted messaging with session key management
- **Smart Contract Verification**: All trading and DAO operations on-chain
- **Type Safety**: Full TypeScript coverage prevents runtime errors
- **Environment Variables**: Sensitive data never hardcoded

---

## 📊 Data Flow

```
User Wallet
    ↓
Sui dApp Kit (Connection & Signing)
    ↓
Smart Contracts (Copy Trading, DAOs, Messaging)
    ↓
Supabase (User profiles, community metadata)
    ↓
API Server (Aggregation & off-chain logic)
    ↓
React Frontend (Real-time UI updates)
```

---

## 🎨 UI/UX Highlights

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode Support**: System-aware theme switching
- **Accessibility**: Radix UI primitives for WCAG compliance
- **Real-time Updates**: React Query for optimistic updates
- **Loading States**: Skeleton screens and spinners for better UX
- **Error Boundaries**: Graceful error handling throughout the app

---

## 🔄 Development Workflow

### Running Tests
```bash
# Unit tests (when available)
npm test
```

### Code Quality
- TypeScript strict mode enabled
- ESLint configuration (if present)
- Prettier formatting (if configured)

### Database Schema
See `supabase-schema.sql` for the complete database structure including:
- User profiles
- Community/DAO information
- Trading relationships
- Message channels

---

## 📦 Deployment

### Deploy to Netlify
```bash
npm run build
# Upload the `dist` folder to Netlify
```

### Environment Setup for Production
- Update API endpoints to production URLs
- Configure production Supabase project
- Set appropriate CORS policies
- Enable wallet network switching (mainnet/testnet)

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

---

## 📝 Project Structure

```
otter-webapp/
├── src/
│   ├── pages/              # Route pages (Messages, CopyTrading, etc.)
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React context providers
│   ├── lib/                # Utility functions & smart contract interactions
│   ├── providers/          # Provider components (Messaging, SessionKey)
│   ├── layouts/            # Layout components
│   ├── utils/              # Helper utilities
│   ├── App.tsx             # Root component
│   ├── router.tsx          # Route configuration
│   └── main.tsx            # Entry point
├── move/                   # Sui smart contracts
├── api-server.js           # Backend API server
├── supabase-schema.sql     # Database schema
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

---

## 🐛 Troubleshooting

### Wallet Connection Issues
- Ensure your Sui wallet is installed and unlocked
- Try switching networks in wallet settings
- Clear browser cache and reconnect

### Transaction Failures
- Check wallet balance for gas fees
- Verify smart contract addresses in environment
- Check Sui network status

### Messaging Not Working
- Initialize messaging session on first use
- Ensure both parties have initialized messaging
- Check browser console for detailed errors

---

## 📚 Resources

- [Sui Documentation](https://docs.sui.io/)
- [Sui dApp Kit](https://sdk.mystenlabs.com/dapp-kit)
- [Fetch.ai Documentation](https://fetch.ai/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📄 License

This project is part of the Cal Hacks hackathon submission.

---

## 🦦 Team

Built with ❤️ for the Sui ecosystem and Web3 community.

**Questions or feedback?** Open an issue or reach out to the team!
