# Otter Web App - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Sui wallet (Sui Move / Explorer)
- Environment variables configured

### Installation
```bash
cd /Users/dhiyaan/code/sui-otter/otter-webapp
npm install
```

### Development
```bash
npm run dev
# Opens at http://localhost:3001
```

### Production Build
```bash
npm run build
npm run preview  # Test production build locally
```

---

## 📂 Project Structure

```
src/
├── pages/                      # Page components
│   ├── DiscoverPage.tsx       # Discovery/Browse
│   ├── ProfilePage.tsx        # User profile
│   ├── SettingsPage.tsx       # User settings
│   ├── MessagesPage.tsx       # Messaging interface
│   ├── GroupsPage.tsx         # Group management
│   └── StreamPage.tsx         # Activity stream
│
├── components/
│   ├── layout/                # Layout components
│   │   ├── sidebar.tsx
│   │   └── topbar.tsx
│   ├── messages/              # Message components
│   ├── groups/                # Group components
│   ├── stream/                # Stream components
│   ├── ui/                    # Reusable UI components
│   ├── wallet-connection.tsx  # Wallet integration
│   └── theme-provider.tsx     # Theme management
│
├── providers/
│   ├── SessionKeyProvider.tsx # Session management
│   └── MessagingClientProvider.tsx # Messaging SDK
│
├── hooks/
│   ├── useMessaging.ts        # Messaging hook
│   └── use-transaction-polling.ts
│
├── lib/
│   ├── api/                   # API client functions
│   ├── utils.ts               # Utility functions
│   ├── mock-data.ts           # Mock data for development
│   └── services/              # Business logic
│
├── router.tsx                 # React Router configuration
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
└── index.css                  # Global styles
```

---

## 🔧 Key Features

### Wallet Integration
- Connected through `@mysten/dapp-kit`
- Automatic wallet detection
- User menu shows real wallet address

### Theme System
- Light/Dark/System theme options
- Stored in localStorage
- Custom `ThemeProvider` for control

### Pages

| Page | Status | Features |
|------|--------|----------|
| Discover | ✅ Full | Browse channels, communities, trending |
| Profile | ✅ Full | View wallet info, statistics, actions |
| Settings | ✅ Full | Theme, notifications, privacy |
| Messages | ✅ Working | Direct messaging via SDK |
| Groups | ✅ Working | Group conversations |
| Stream | ✅ Working | Transaction activity |

---

## 🛠️ Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run TypeScript check
npm run tsc

# Format code (if configured)
npm run format

# Lint code (if configured)
npm run lint
```

---

## 📋 Environment Variables

Create `.env` file in project root:

```env
# Sui Network Configuration
VITE_SUI_NETWORK=testnet

# Gemini API (optional)
VITE_GEMINI_API_KEY=your_api_key_here

# Other configurations as needed
```

---

## 🔌 Integration Points

### Messaging SDK
Located in `src/providers/MessagingClientProvider.tsx`
- Provides messaging hooks via `useMessaging()`
- Session key management via `SessionKeyProvider`

### API Clients
Located in `src/lib/api/`
- `addressActivity.ts` - Get address activity
- `randomAddress.ts` - Get random address for demo
- `recentTransactions.ts` - Fetch recent transactions
- `transactionExplainer.ts` - Explain transactions with AI

### Styling
- Tailwind CSS for utility classes
- Custom CSS in `src/index.css`
- Radix UI for component styling
- Dark mode support via custom theme provider

---

## 🐛 Common Issues & Solutions

### Issue: Wallet won't connect
**Solution:** Ensure wallet extension is installed and enabled
```typescript
const currentAccount = useCurrentAccount();
if (!currentAccount) {
  // Wallet not connected
}
```

### Issue: Build errors with TypeScript
**Solution:** Run type check before build
```bash
npm run tsc
# Fix errors shown
```

### Issue: Theme not persisting
**Solution:** Check localStorage (might be blocked in incognito)
```javascript
// Verify in browser console
localStorage.getItem('vite-ui-theme')
```

### Issue: Messages not loading
**Solution:** Check Messaging SDK initialization
```bash
# Verify providers are wrapped
# SessionKeyProvider > MessagingClientProvider > App
```

---

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Router v6](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Sui SDK](https://sdk.mystenlabs.com/)
- [Radix UI](https://radix-ui.com/)

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
# Creates optimized dist/ folder
```

### Deploy to Vercel
```bash
# Push to GitHub, connect repo to Vercel
# Automatic builds on push
```

### Deploy to Netlify
```bash
npm run build
# Deploy dist/ folder
```

---

## 📝 Development Tips

1. **Component Development**
   - Use Storybook or dev server for isolated testing
   - Keep components small and focused
   - Use TypeScript for type safety

2. **State Management**
   - Use React hooks for local state
   - Use context for shared state (messaging, theme)
   - Keep derived state computed, not stored

3. **Performance**
   - Use React.memo for expensive components
   - Lazy load pages with React.lazy()
   - Monitor bundle size with `npm run build`

4. **Testing**
   - Add unit tests for utilities
   - Integration tests for pages
   - E2E tests for critical flows

---

## 🎯 Next Steps

1. **Connect Real Backend**
   - Replace mock data in `src/lib/mock-data.ts`
   - Implement real API calls in `src/lib/api/`

2. **Add Features**
   - User authentication
   - Real database integration
   - Payment processing

3. **Optimize**
   - Code splitting for pages
   - Image optimization
   - Bundle analysis

---

**For issues or questions, check the full migration report:**
📄 `MIGRATION_COMPLETION_REPORT.md`

---

Last Updated: October 26, 2025
