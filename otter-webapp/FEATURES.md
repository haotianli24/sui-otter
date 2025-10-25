# Feature Documentation

## 🎨 UI/UX Features

### Theme System
- **Dark Mode** (default)
- **Light Mode**
- **System Mode** (follows OS preference)
- Toggle via button in top-right corner
- Persists across sessions
- Smooth transitions between modes

### Color Palette
- **Primary:** Supabase Green (#3ECF8E)
  - Used for: Active states, CTAs, links, accents
- **Backgrounds:** 
  - Dark: #0f172a (main), #1e293b (cards)
  - Light: #ffffff (main), #ffffff (cards)
- **Sharp Design:** Zero border radius, clean lines

### Typography
- **Font:** Open Sans (loaded via next/font)
- **Sizes:** From 3xl (page titles) to xs (metadata)
- **Weights:** Bold for headings, regular for body

---

## 💬 Messaging Features

### Direct Messages
- **1-on-1 Conversations**
  - List view with avatars
  - Last message preview
  - Unread count badges
  - Time since last message
  - Active conversation highlight

- **Message Types**
  - Text messages (standard)
  - Trade shares (with copy button)
  - Crypto transfers (visual card)

- **Message Input**
  - Auto-expanding textarea
  - Max height: 120px
  - Emoji button (placeholder)
  - Attach file button (placeholder)
  - Command hints displayed

### Group Chats
- **Community Discussions**
  - Group list with member counts
  - Same message types as DMs
  - Member sidebar (toggleable)
  - Group avatar and name
  - Participant list

- **Member Sidebar**
  - Shows all group members
  - Avatar + name + address
  - Collapsible for more space
  - Toggle via user icon in header

---

## 🌐 Discovery & Communities

### Discover Page
- **Search Functionality**
  - Real-time filtering
  - Searches names and descriptions
  - Instant results

- **Filters**
  - All communities
  - Free only
  - Paid only
  - Token-gated only
  - Active filter highlighted

- **Community Cards**
  - Avatar/logo
  - Name and description
  - Member count
  - P&L stats (green/red)
  - Type indicator (lock/coin icons)
  - Pricing info
  - Owner information
  - Join/Subscribe button

### Community Types
1. **Free Communities**
   - Open to everyone
   - "Join Free" button
   - No payment required

2. **Paid Communities**
   - Monthly subscription fee
   - Price shown in SUI
   - "Subscribe" button
   - Lock icon indicator

3. **Token-Gated Communities**
   - Requires holding specific tokens
   - Token symbol and amount shown
   - "Join with Token" button
   - Coin icon indicator

---

## 👤 Profile & Portfolio

### Profile Section
- **User Information**
  - Avatar with initials
  - Display name
  - Bio/description
  - Wallet address (copyable)
  - Edit profile button

### Portfolio Overview
- **Financial Stats**
  - Total balance (SUI + USD)
  - Total P&L ($ and %)
  - Active trades count
  - Communities count (owned + joined)

- **Visual Presentation**
  - Grid layout (4 columns on desktop)
  - Color-coded P&L (green = profit)
  - Clear labels and values

### Communities Management
- **Owned Communities**
  - List of communities you created
  - Member counts
  - P&L per community
  - "Manage" buttons
  - "Create New" button

- **Subscribed Communities**
  - Communities you've joined
  - Owner information
  - P&L stats
  - "View" buttons

---

## ⚙️ Settings

### Account Settings
- **Profile Information**
  - Edit name
  - Edit bio
  - View wallet address (read-only)

### Appearance
- **Theme Selector**
  - Light/Dark/System buttons
  - Visual preview of current theme
  - Instant switching

### Features
- **Transaction Explainer**
  - Toggle on/off
  - Explains transactions in plain English
  - Helpful for beginners

### Notifications
- **New Messages** - Toggle
- **Trade Posts** - Toggle
- **Community Updates** - Toggle
- **Price Alerts** - Toggle

### Security
- Change password (placeholder)
- Two-factor authentication (placeholder)
- Connected wallets (placeholder)

---

## 🎯 Interactive Components

### Copy Trade Modal
**Triggered by:** Clicking "Copy Trade" on trade messages

**Features:**
- Trade summary display
  - Action (BUY/SELL)
  - Token name
  - Original price
- Amount input (editable)
- Estimated cost calculation
- Risk warning message
- Execute/Cancel buttons
- Loading state during execution

**Flow:**
1. User sees trade in chat
2. Clicks "Copy Trade"
3. Modal opens with trade details
4. Can adjust amount
5. Reviews estimated cost
6. Clicks "Execute" or "Cancel"
7. Confirmation alert (will connect to wallet)

### Create Community Modal
**Triggered by:** Clicking "Create New" in Profile

**Features:**
- Community name input
- Description textarea
- Type selector (3 buttons)
- Conditional fields:
  - Paid: Monthly price input
  - Token-gated: Token symbol + amount
- Form validation
- Create/Cancel buttons

**Flow:**
1. Click "Create New" button
2. Modal opens
3. Fill in name and description
4. Select community type
5. Fill type-specific fields if needed
6. Click "Create" (disabled if invalid)
7. Confirmation alert (will call smart contract)

### Toast Notifications
**Purpose:** Provide user feedback

**Types:**
- Success (green checkmark)
- Error (red alert circle)
- Info (blue info circle)

**Features:**
- Auto-dismiss after 3 seconds
- Manual close button
- Multiple toasts stack
- Bottom-right positioning
- Slide-in animation

---

## ⌨️ Keyboard Shortcuts

### Message Input
- **Enter:** Send message
- **Shift + Enter:** New line
- **Escape:** (Future) Clear input

### Navigation
- **Tab:** Move focus between elements
- **Enter/Space:** Activate buttons and links

### Accessibility
- All interactive elements keyboard accessible
- Focus visible states (ring outline)
- Screen reader friendly

---

## 📱 Mobile Features

### Responsive Design
- **Breakpoints**
  - Mobile: < 768px
  - Desktop: ≥ 768px

### Mobile Navigation
- **Hamburger Menu**
  - Top-left corner
  - Opens/closes sidebar
  - Overlay darkens background
  - Click outside to close

- **Sidebar**
  - Slides in from left
  - Fixed positioning
  - Full height
  - Touch-friendly targets

### Touch Interactions
- Tap to select conversations
- Tap to open modals
- Swipe scroll for lists
- Pinch zoom on images (future)

---

## 🎨 Animations & Transitions

### Global
- 200ms color transitions on all elements
- Smooth theme switching

### Specific Elements
- Sidebar slide-in/out (mobile)
- Modal fade + zoom in
- Toast slide-in from right
- Textarea auto-expand
- Button hover states

### Loading States
- Button text changes to "Loading..."
- Disabled state during async operations
- Spinner in future loader components

---

## 🔍 Search & Filter

### Search Functionality
- **Live Search**
  - Updates as you type
  - No submit button needed
  - Case insensitive
  - Searches multiple fields

- **Search Fields**
  - Community names
  - Community descriptions
  - (Future) User names in conversations

### Filtering
- **Multiple Filters**
  - Combine with search
  - Exclusive selection (one at a time)
  - Visual active state
  - Reset with "All" button

---

## ♿ Accessibility Features

### Keyboard Navigation
- Full keyboard support
- Logical tab order
- Skip links (future)

### Visual
- High contrast in both themes
- Clear focus indicators
- Readable font sizes
- Proper heading hierarchy

### Screen Readers
- Semantic HTML
- ARIA labels where needed
- Alt text for images (when added)
- Descriptive button text

### Forms
- Proper labels
- Error messages
- Required field indicators
- Validation feedback

---

## 🚀 Performance

### Optimizations
- Next.js App Router (React Server Components)
- Font optimization via next/font
- Image optimization (when images added)
- Code splitting automatic
- Turbopack for fast dev builds

### Loading States
- Skeleton screens (future)
- Loading spinners prepared
- Optimistic UI updates
- Smooth transitions

---

## 🎭 Mock Data Features

### Realistic Testing Data
- **Users:** 5 diverse personas
- **Conversations:** 3 DMs, 2 groups
- **Messages:** Various types and timestamps
- **Communities:** 10 with varied attributes
- **Trades:** Example buy/sell transactions
- **Portfolio:** Realistic P&L data

### Time-based Features
- Relative timestamps ("2h ago")
- Recent activity indicators
- Chronological message ordering

---

## 🔮 Prepared for Future

### Placeholders Ready
- Emoji picker button
- File attachment button
- Media upload handling
- Real-time subscriptions
- Notification system
- Search optimization

### Integration Points
- All backend functions mapped
- Smart contract references documented
- API endpoints identified
- Database schemas planned

---

## ✨ Polish & Details

### Micro-interactions
- Hover effects on cards
- Button press feedback
- Link hover states
- Active navigation highlighting

### Visual Feedback
- Unread badges
- Typing indicators (future)
- Online status (future)
- Message delivery status (future)

### User Delight
- Smooth animations
- Clean transitions
- Helpful tooltips
- Command hints
- Keyboard shortcuts
- Copy-to-clipboard feedback

---

Built with attention to detail and ready for your demo! 🎉

