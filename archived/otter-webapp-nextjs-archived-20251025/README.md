# Otter Web App

Telegram-like web interface for the Otter decentralized social trading platform.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Fonts:** Open Sans
- **Theme:** Dark/Light mode with Supabase green accent (#3ECF8E)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will run on `http://localhost:3001` (separate port from main otter app).

### Build

```bash
npm run build
npm start
```

## Project Structure

```
otter-webapp/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── messages/          # Direct messages page
│   │   ├── groups/            # Group chats page
│   │   ├── discover/          # Community discovery page
│   │   ├── profile/           # User profile & portfolio
│   │   └── settings/          # App settings
│   ├── components/
│   │   ├── layout/            # Sidebar, TopBar
│   │   ├── messages/          # Message components
│   │   ├── groups/            # Group & community components
│   │   └── ui/                # shadcn/ui components
│   └── lib/
│       ├── mock-data.ts       # Mock data for development
│       ├── utils.ts           # Utilities
│       └── format-date.ts     # Date formatting
└── public/                    # Static assets
```

## Features

### Current Status: ✅ UI Template Complete

All pages are fully templated with mock data and interactive features:

- ✅ **Direct Messages** - 1-on-1 conversations with message bubbles, trade sharing, crypto transfers
  - Auto-resizing message input with emoji button
  - Copy trade modal with amount customization
  - Command hints (/send for crypto transfers)
- ✅ **Group Chats** - Community discussions with member sidebar
  - Toggleable member list
  - Same rich messaging features as DMs
- ✅ **Discover** - Browse and filter communities (paid, free, token-gated)
  - Search functionality
  - Filter by community type
  - P&L stats and member counts
- ✅ **Profile** - User info, portfolio stats, owned/subscribed communities
  - Portfolio overview with mock data
  - Community creation modal
  - Manage owned/subscribed communities
- ✅ **Settings** - Theme toggle, transaction explainer, notifications
  - Dark/Light/System theme support
  - Transaction explainer toggle
  - Notification preferences

### Interactive Features

- ✅ **Copy Trade Modal** - Review and execute trades with custom amounts
- ✅ **Create Community Modal** - Full form for creating paid/free/token-gated communities
- ✅ **Toast Notifications** - User feedback system (success/error/info)
- ✅ **Mobile Responsive** - Collapsible sidebar with overlay
- ✅ **Keyboard Shortcuts** - Enter to send, Shift+Enter for new line
- ✅ **Auto-resize Textarea** - Message input expands as you type

### Next Steps: Backend Integration

See `INTEGRATION.md` for detailed integration guide.

## Design System

### Colors

- **Primary (Supabase Green):** `#3ECF8E` - Accents, CTAs, active states
- **Background (Dark):** `#0f172a`
- **Background (Light):** `#ffffff`
- **Card (Dark):** `#1e293b`
- **Card (Light):** `#ffffff`

### Typography

- **Font Family:** Open Sans
- **Headings:** Bold, sized from 2xl to base
- **Body:** Regular, 14px (text-sm)

### Spacing

- Consistent padding: 4, 6, 8 units (1rem = 16px)
- Sharp edges (no rounded corners) for a clean, distinct look

## Development Notes

- This app is intentionally separate from `/otter/` to avoid merge conflicts
- Uses port 3001 to run alongside the main app
- All functionality currently uses mock data
- Ready for incremental backend integration

