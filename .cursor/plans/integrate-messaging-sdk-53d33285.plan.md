<!-- 53d33285-d2d7-4382-b9a3-c9c429f5be0a 59e43773-3c03-4e72-83ba-f216a4dca292 -->
# Migrate Otter Web App to Vite - DETAILED EXECUTION PLAN

## Critical Success Factors

1. **Use EXACT versions from messaging-sdk-example** (not otter-webapp-old versions)
2. **Test after every major step** with `npm run build` and `npm run dev`
3. **Copy from otter-chat** (proven working) not from scratch
4. **Archive old Next.js app** when done

## EXACT Package Versions to Use (From messaging-sdk-example)

```json
{
  "@mysten/bcs": "^1.8.0",
  "@mysten/dapp-kit": "0.18.0",  
  "@mysten/messaging": "file:../messaging-sdk-example/mysten-messaging-0.0.1.tgz",
  "@mysten/seal": "^0.6.0",
  "@mysten/sui": "1.38.0",
  "@radix-ui/themes": "^3.2.1",
  "@tanstack/react-query": "^5.87.1",
  "react": "^18.3.1",
  "react-dom": "^18.3.1"
}
```

## Phase 1: Foundation - Copy Working otter-chat

### Step 1.1: Create Base Structure from otter-chat

**Action:** Copy entire otter-chat as starting point

```bash
cp -r otter-chat otter-webapp-vite
cd otter-webapp-vite
```

**Test:** `npm run dev` - should start on port 3002

**Expected:** Basic messaging app works

### Step 1.2: Add Additional Dependencies for Otter Features

**Action:** Update package.json to add:

```json
{
  "@google/genai": "^1.27.0",
  "date-fns": "^4.1.0",
  "lru-cache": "^11.2.2",
  "lucide-react": "^0.548.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1",
  "zod": "^4.1.12",
  "react-router-dom": "^6.28.0"
}
```

**Test:** `npm install` then `npm run build`

**Expected:** Build succeeds with no errors

### Step 1.3: Configure Tailwind CSS

**Action:**

- Install: `npm install -D tailwindcss postcss autoprefixer`
- Create `tailwind.config.js`
- Create `postcss.config.js`
- Add Tailwind directives to src/index.css

**Test:** `npm run dev` - Tailwind classes should work

**Expected:** Styles render correctly

## Phase 2: Routing Setup

### Step 2.1: Install React Router

**Action:**

```bash
npm install react-router-dom
```

**Test:** `npm run build`

**Expected:** No errors

### Step 2.2: Create Router Structure

**Action:** Create `src/router.tsx` with routes:

- `/` → redirect to `/messages`
- `/messages` → MessagesPage
- `/groups` → GroupsPage
- `/stream` → StreamPage
- `/discover` → DiscoverPage
- `/profile` → ProfilePage
- `/settings` → SettingsPage

**Test:** `npm run dev` and navigate to each route

**Expected:** Routes render (even if empty)

### Step 2.3: Create MainLayout Wrapper

**Action:** Create `src/layouts/MainLayout.tsx` with Sidebar + TopBar

**Test:** Visit `/messages` - should see layout

**Expected:** Sidebar and TopBar render

## Phase 3: Copy All Components & Utils

### Step 3.1: Copy UI Components from otter-webapp-old

**Action:** Copy entire `components/ui/` directory

- avatar.tsx, badge.tsx, button.tsx, dialog.tsx, dropdown-menu.tsx
- empty-state.tsx, input.tsx, loading.tsx, switch.tsx, toast.tsx

**Test:** Build and check for import errors

**Expected:** No TypeScript errors

### Step 3.2: Copy Layout Components

**Action:** Copy:

- `components/layout/sidebar.tsx`
- `components/layout/topbar.tsx`

**Modifications:**

- Remove `"use client"` directives
- Replace Next.js `<Link>` with React Router `<Link>`
- Update imports

**Test:** Check sidebar renders and navigation works

**Expected:** Click sidebar items navigates

### Step 3.3: Copy All Library Utilities

**Action:** Copy entire `lib/` directory from otter-webapp-old:

- format-date.ts
- gemini-service.ts
- integration-points.ts
- messagingHelpers.ts
- mock-data.ts
- protocol-registry.ts
- transaction-cache.ts
- transaction-detector.ts
- utils.ts

**Skip:** messaging-service.ts.old, suiClient.ts.old

**Modifications:**

- Update `process.env.NEXT_PUBLIC_*` → `import.meta.env.VITE_*`

**Test:** `npm run build`

**Expected:** All utilities compile

### Step 3.4: Copy Theme Provider

**Action:** Create custom theme provider (no next-themes)

- Copy `components/theme-provider.tsx`
- Replace next-themes with localStorage implementation

**Test:** Theme toggle in TopBar works

**Expected:** Dark/light mode switches

## Phase 4: Messages Page (PRIORITY)

### Step 4.1: Copy Message Components

**Action:** Copy from otter-webapp-old/src/components/messages/:

- blockchain-conversation-list.tsx
- blockchain-message-bubble.tsx
- conversation-list.tsx
- message-input.tsx
- empty-messages.tsx
- copy-trade-modal.tsx

**Modifications:**

- Remove `"use client"`
- Update imports to use `@/` aliases

**Test:** Import each component in App.tsx

**Expected:** No import errors

### Step 4.2: Create Messages Page

**Action:** Create `src/pages/MessagesPage.tsx`

- Copy logic from otter-webapp-old/src/app/messages/page.tsx
- Remove Next.js specific code
- Use imported components

**Test:** Visit `/messages` route

**Expected:** Messages page renders with layout

### Step 4.3: Integrate Real Messaging

**Action:** Update MessagesPage to use real SDK

- Already have working providers from otter-chat
- Connect UI components to SDK hooks

**Test:** Connect wallet → Initialize session → Create channel

**Expected:** Full messaging flow works

## Phase 5: Other Pages

### Step 5.1: Groups Page

**Action:**

- Copy `components/groups/` directory (4 files)
- Create `src/pages/GroupsPage.tsx` from app/groups/page.tsx

**Test:** Visit `/groups`

**Expected:** Groups page renders

### Step 5.2: Stream Page

**Action:**

- Copy `components/stream/` directory (3 files)
- Copy `components/transaction/` directory (3 files)
- Create `src/pages/StreamPage.tsx` from app/stream/page.tsx

**Test:** Visit `/stream`

**Expected:** Stream page renders

### Step 5.3: Discover, Profile, Settings Pages

**Action:** Create simple pages:

- `src/pages/DiscoverPage.tsx`
- `src/pages/ProfilePage.tsx`
- `src/pages/SettingsPage.tsx`

**Test:** Visit each route

**Expected:** All pages accessible

## Phase 6: API Integration

### Step 6.1: Convert API Routes to Client Functions

**Action:** Create `src/lib/api/` directory:

- `addressActivity.ts` (from api/address-activity/route.ts)
- `randomAddress.ts` (from api/random-address/route.ts)
- `recentTransactions.ts` (from api/recent-transactions/route.ts)
- `transactionExplain.ts` (from api/transaction-explain/route.ts)
- `transactionExplorer.ts` (from api/transaction-explorer/route.ts)

**Modifications:**

- Convert Next.js Response → return data directly
- Use fetch() for external APIs
- Use environment variables for keys

**Test:** Call each function from console

**Expected:** Functions return data

### Step 6.2: Update Components Using APIs

**Action:** Update components that use APIs:

- TransactionEmbed.tsx
- activity-list.tsx
- etc.

**Test:** Check transaction embeds load

**Expected:** No errors in console

## Phase 7: Styling & Polish

### Step 7.1: Copy Global Styles

**Action:**

- Copy relevant CSS from otter-webapp-old/src/app/globals.css
- Merge with existing src/index.css
- Import Radix themes CSS

**Test:** Check all pages look correct

**Expected:** Styles match original

### Step 7.2: Configure Vite Path Aliases

**Action:** Update vite.config.ts:

```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

**Test:** All `@/` imports work

**Expected:** No import errors

### Step 7.3: Update Port to 3001

**Action:** Change vite.config.ts port from 3002 to 3001

**Test:** `npm run dev` starts on 3001

**Expected:** App runs on correct port

## Phase 8: Environment Variables

### Step 8.1: Create .env File

**Action:** Create `.env`:

```env
VITE_GEMINI_API_KEY=your_key
VITE_SUI_NETWORK=testnet
```

**Test:** Access `import.meta.env.VITE_GEMINI_API_KEY`

**Expected:** Variables accessible

### Step 8.2: Update All Env Variable References

**Action:** Find and replace:

- `process.env.NEXT_PUBLIC_` → `import.meta.env.VITE_`

**Test:** Search codebase for process.env

**Expected:** No Next.js env vars remain

## Phase 9: Final Testing

### Step 9.1: Build Test

**Action:** `npm run build`

**Expected:** Build succeeds with zero errors

### Step 9.2: Feature Testing Checklist

Test each feature:

- ✅ Wallet connects
- ✅ Session initializes
- ✅ Channel creation works
- ✅ Messages send/receive
- ✅ Navigation between pages
- ✅ Theme toggle works
- ✅ Transaction embeds load
- ✅ AI explanations work (if API key set)
- ✅ All UI components render
- ✅ No console errors

### Step 9.3: Production Preview

**Action:** `npm run preview`

**Expected:** Production build works

## Phase 10: Cleanup & Archive

### Step 10.1: Archive Old Next.js App

**Action:**

```bash
mv otter-webapp-old otter-webapp-nextjs-archived-$(date +%Y%m%d)
```

### Step 10.2: Rename New App

**Action:**

```bash
mv otter-webapp-vite otter-webapp
```

### Step 10.3: Update Documentation

**Action:** Update README.md with:

- Vite commands (`npm run dev`, `npm run build`)
- Environment variables
- Port 3001
- Dependencies used

## Testing Checkpoints

**Checkpoint 1 (After Phase 1):**

- Run `npm run dev`
- Wallet connects
- Messages work

**Checkpoint 2 (After Phase 3):**

- Run `npm run build`
- No TypeScript errors
- UI components render

**Checkpoint 3 (After Phase 4):**

- Messages page fully functional
- Can create channels
- Can send messages

**Checkpoint 4 (After Phase 5):**

- All pages accessible
- Navigation works
- No broken links

**Checkpoint 5 (After Phase 9):**

- Production build succeeds
- All features work
- No console errors

## Critical Files to Create/Modify

**New Files:**

- `src/router.tsx`
- `src/layouts/MainLayout.tsx`
- `src/pages/MessagesPage.tsx`
- `src/pages/GroupsPage.tsx`
- `src/pages/StreamPage.tsx`
- `src/pages/DiscoverPage.tsx`
- `src/pages/ProfilePage.tsx`
- `src/pages/SettingsPage.tsx`
- `tailwind.config.js`
- `postcss.config.js`
- `.env`

**Modified Files:**

- `src/App.tsx` (add router)
- `src/main.tsx` (if needed)
- `vite.config.ts` (aliases, port)
- `package.json` (dependencies)

## Success Metrics

✅ All tests pass at every checkpoint

✅ Zero TypeScript errors

✅ Zero console errors

✅ All original features work

✅ Messaging SDK fully functional

✅ Build time < 30 seconds

✅ Dev server starts < 5 seconds

✅ App runs on port 3001

### To-dos

- [ ] Copy SDK .tgz and install dependencies
- [ ] Create sessionStorage utility functions
- [ ] Create SessionKeyProvider with session management
- [ ] Create MessagingClientProvider with SDK client setup
- [ ] Rewrite useMessaging hook with SDK methods
- [ ] Refactor messaging-context to use SDK
- [ ] Update messages page and components with real data
- [ ] Add new providers to app layout
- [ ] Add channel creation UI
- [ ] Archive the old files so they don't get used and test everything