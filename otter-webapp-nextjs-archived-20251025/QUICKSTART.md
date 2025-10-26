# Quick Start Guide

## 🚀 Getting Started

The app is already running at **http://localhost:3001**

### First Time Setup

```bash
# Navigate to the project
cd /Users/dhiyaan/code/sui-otter/otter-webapp

# Install dependencies (already done)
npm install

# Start dev server
npm run dev
```

### Development

```bash
# Run dev server on port 3001
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📍 Page URLs

Once running, visit these pages:

- **Messages:** http://localhost:3001/messages
- **Groups:** http://localhost:3001/groups
- **Discover:** http://localhost:3001/discover
- **Profile:** http://localhost:3001/profile
- **Settings:** http://localhost:3001/settings

## 🎨 Features to Test

### Direct Messages
1. Click a conversation from the list
2. Type a message and press Enter to send
3. Try multi-line with Shift+Enter
4. Scroll to see trade message with "Copy Trade" button
5. Click "Copy Trade" to open modal
6. Try changing the amount and clicking "Execute"

### Groups
1. Select a group from the list
2. Toggle member sidebar (user icon in header)
3. Send messages just like DMs
4. View trade shares in group context

### Discover
1. Search for communities (try typing "Alpha")
2. Filter by Free/Paid/Token-Gated
3. View P&L stats on each card
4. Click "Subscribe" or "Join" buttons

### Profile
1. View your mock portfolio stats
2. Click "Create New" to open community creation modal
3. Fill out the form and try different community types
4. View owned and subscribed communities

### Settings
1. Toggle theme between Dark/Light/System
2. Enable/disable Transaction Explainer
3. Toggle notification preferences
4. Try editing profile fields

### Mobile
1. Resize browser to mobile width (or use DevTools device mode)
2. Click hamburger menu (top-left)
3. Navigate between pages
4. Sidebar slides in/out smoothly

## 🎯 Key Interactions

### Message Input
- **Enter:** Send message
- **Shift+Enter:** New line
- **Auto-resize:** Textarea grows as you type (max 120px)
- **Emoji button:** Placeholder for future emoji picker
- **Attach button:** Placeholder for media upload

### Copy Trade Modal
- Edit amount field
- See estimated cost update
- Risk warning displayed
- Execute/Cancel buttons

### Create Community Modal
- Switch between Free/Paid/Token-Gated
- Conditional fields appear based on type
- Form validation (all required fields must be filled)

### Theme Toggle
- Icon in top-right of TopBar
- Switches between Dark/Light modes
- System option follows OS preference
- Instant visual feedback

### Search & Filter
- Real-time search in Discover page
- Filter buttons in Discover
- Results update instantly

## 📊 Mock Data

All data is currently mocked in `/src/lib/mock-data.ts`:

- 5 users (Alice, Bob, Charlie, Diana, Ethan)
- 3 DM conversations with message history
- 2 group conversations
- 10 communities (varied types and P&L)
- Different message types: text, trade, crypto

## 🔧 Configuration

### Ports
- **Web App:** 3001 (this app)
- **Main Otter:** 3000 (your teammates' app)

### Theme
- **Default:** Dark mode
- **Accent:** Supabase green (#3ECF8E)
- **Font:** Open Sans

### Environment Variables
When ready to connect to backend, create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Enoki
NEXT_PUBLIC_ENOKI_PUBLIC_APP_SLUGS=...
ENOKI_SECRET_KEY=...

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...

# Sui Network
NEXT_PUBLIC_SUI_NETWORK=testnet
```

## 📝 Development Tips

### Making Changes
1. Edit files in `/src`
2. Changes hot-reload automatically
3. Check terminal for any errors
4. No linting errors currently!

### Adding New Pages
1. Create folder in `/src/app/[pagename]`
2. Add `page.tsx` file
3. Add route to sidebar navigation in `/src/components/layout/sidebar.tsx`

### Styling
- Use Tailwind classes (already configured)
- Colors defined in `/src/app/globals.css`
- Use `cn()` utility from `/src/lib/utils.ts` for conditional classes

### Components
- UI components in `/src/components/ui/`
- Layout components in `/src/components/layout/`
- Feature components in `/src/components/messages/` and `/src/components/groups/`

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in package.json
"dev": "next dev -p 3002"
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Type Errors
All TypeScript should be working. If you see errors:
```bash
# Check TypeScript
npx tsc --noEmit
```

## 📚 Documentation

- **README.md** - Full project overview
- **INTEGRATION.md** - Backend integration guide  
- **SUMMARY.md** - Complete feature list
- **QUICKSTART.md** - This file

## 🎉 Ready to Demo!

Your app is fully functional with:
- ✅ All 5 pages working
- ✅ Interactive components (modals, forms)
- ✅ Mobile responsive
- ✅ Theme switching
- ✅ Mock data for realistic demo
- ✅ Toast notifications
- ✅ Keyboard shortcuts

Enjoy exploring! 🚀

