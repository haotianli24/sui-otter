# Otter Web App

A modern, secure messaging application built with Vite, React, and the Mysten Messaging SDK for Sui blockchain.

## Features

- 🔐 **Secure Messaging**: End-to-end encrypted messaging with session keys
- 💬 **Real-time Chat**: Direct messages and group conversations
- 📊 **Activity Stream**: Monitor blockchain transactions with AI explanations
- 🎨 **Modern UI**: Responsive design with dark/light theme support
- 🔗 **Wallet Integration**: Seamless Sui wallet connection
- 🚀 **Fast Performance**: Built with Vite for optimal development experience

## Tech Stack

- **Frontend**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 7.1.5
- **Styling**: Tailwind CSS v4 with Radix UI components
- **Routing**: React Router v6
- **Blockchain**: Mysten Sui SDK with Messaging protocol
- **State Management**: React Query for server state
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Sui wallet (e.g., Sui Wallet browser extension)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API keys:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_SUI_NETWORK=testnet
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3001](http://localhost:3001) in your browser

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   ├── layout/         # Layout components (sidebar, topbar)
│   ├── messages/       # Messaging components
│   ├── groups/         # Group chat components
│   ├── stream/         # Activity stream components
│   └── transaction/    # Transaction display components
├── pages/              # Route components
├── lib/                # Utilities and API functions
│   └── api/           # Client-side API functions
├── hooks/              # Custom React hooks
├── providers/          # Context providers
└── layouts/           # Layout wrappers
```

## Key Dependencies

### Core Framework
- `@mysten/dapp-kit` (0.18.0) - Sui wallet integration
- `@mysten/messaging` - Secure messaging protocol
- `@mysten/sui` (1.38.0) - Sui blockchain client
- `react` (18.3.1) - UI framework
- `react-dom` (18.3.1) - React DOM bindings

### UI & Styling
- `@radix-ui/themes` (3.2.1) - Component system
- `tailwindcss` (4.1.16) - Utility-first CSS
- `lucide-react` (0.548.0) - Icon library
- `class-variance-authority` (0.7.1) - Component variants

### Development Tools
- `vite` (7.1.5) - Build tool and dev server
- `typescript` (5.9.2) - Type checking
- `@vitejs/plugin-react-swc` - Fast React compilation

## Environment Variables

- `VITE_GEMINI_API_KEY` - Google Gemini API key for AI explanations
- `VITE_SUI_NETWORK` - Sui network (testnet/mainnet)

## Migration from Next.js

This project was migrated from Next.js to Vite for improved:
- Development server performance
- Build times
- Hot module replacement
- Bundle analysis and optimization

### Key Changes
- Next.js API routes → Client-side functions in `lib/api/`
- `process.env.NEXT_PUBLIC_*` → `import.meta.env.VITE_*`
- Next.js `<Link>` → React Router `<Link>`
- `next-themes` → Custom localStorage theme provider

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and build: `npm run build`
5. Submit a pull request

## License

MIT License - see LICENSE file for details
