# Vercel Environment Variables Setup

The build is failing because Supabase environment variables are not configured in Vercel.

## Required Environment Variables

Add these environment variables in your Vercel project dashboard:

### 1. Go to Vercel Dashboard
- Navigate to your project: https://vercel.com/[your-username]/sui-otter/settings/environment-variables

### 2. Add the following variables:

**For the Next.js app (in `/otter` directory):**
```
NEXT_PUBLIC_SUPABASE_URL=https://tnofvkkfojnjagylvvbh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2Z2a2tmb2puamFneWx2dmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDE5OTIsImV4cCI6MjA3NzAxNzk5Mn0.trUa2kic1xIj8KxC2HVVmS_BCD9NbYhURnK3uVQTXlM
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>
ENOKI_SECRET_KEY=<your-enoki-secret-key>
NEXT_PUBLIC_SUI_NETWORK=testnet
```

**For the Vite app (in `/otter-webapp` directory):**
```
VITE_SUPABASE_URL=https://tnofvkkfojnjagylvvbh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRub2Z2a2tmb2puamFneWx2dmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDE5OTIsImV4cCI6MjA3NzAxNzk5Mn0.trUa2kic1xIj8KxC2HVVmS_BCD9NbYhURnK3uVQTXlM

VITE_GEMINI_API_KEY=AIzaSyBdgumYb0N71EZLT1jt-y0chhC54aL7zuc
VITE_FETCHAI_API_KEY=sk_1ca6bd86b301469c87e42c79875dc6ecfa7684f8aaf54dd093bab30c619051a7
```

### 3. Enable for all environments:
- Production
- Preview
- Development

### 4. Redeploy

After adding the variables, redeploy your project. The build should now succeed.

## Fix Applied

The issue was in `/otter/src/app/api/enoki/derive/route.ts` where Supabase was being initialized without checking for environment variables. The code has been updated to:
- Only create Supabase client if environment variables are present
- Gracefully handle missing Supabase configuration
- Return responses even when Supabase is not configured

## Alternative: Disable Supabase Features

If you don't want to use Supabase, you can disable it by making the client optional in all files that use it.

