# Environment Variables Setup

This document describes all environment variables needed for the project.

## 🔐 Security Note
**NEVER commit `.env` files to Git!** They are already in `.gitignore`.

---

## 📦 Agent Environment Variables

Create a file: `/agent/.env`

```bash
# Fetch.ai Agent Configuration
FETCHAI_API_KEY=your_fetchai_api_key_here

# Sui Blockchain Configuration
SUI_RPC_URL=https://rpc-testnet.suiscan.xyz:443

# Copy Trading Smart Contract IDs
COPY_TRADING_PACKAGE_ID=0x899c3fa6d4d44bd618e47707cac5030a10535da0483c2256660fef6bdf4cb657
COPY_TRADING_REGISTRY_ID=0x5a5e8d1f938aad93948cceb59dc8cf440294da805f37d754a07d2e9ac8b765f0

# Agent Polling Configuration (seconds)
POLLING_INTERVAL=10
```

### Where to get the API key:
- **Fetch.ai API Key**: Get from [https://fetch.ai](https://fetch.ai) (optional, agent works without it)

---

## 🌐 Webapp Environment Variables

Create a file: `/otter-webapp/.env`

```bash
# Google Gemini AI (optional - for AI-powered transaction explanations)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Where to get the API key:
- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Note**: The app works fine without it (uses fallback explanations)

---

## 🚀 Quick Setup

### For Agent:
```bash
cd agent
cp .env.example .env
# Edit .env with your API keys
nano .env
```

### For Webapp:
```bash
cd otter-webapp
cp .env.example .env
# Edit .env with your API keys
nano .env
```

---

## ✅ What's Already Configured

These values are already set with defaults:
- ✅ Sui RPC URL (testnet)
- ✅ Smart Contract IDs (deployed on testnet)
- ✅ Polling interval (10 seconds)

You only need to add:
- 🔑 FETCHAI_API_KEY (if using Fetch.ai features)
- 🔑 VITE_GEMINI_API_KEY (if using AI explanations)

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Rotate keys regularly** - Especially if shared publicly
3. **Use different keys** for dev/prod environments
4. **Limit API key permissions** where possible
5. **Use `.env.example`** files to document required variables

---

## 🧪 Testing Without API Keys

Both the agent and webapp work without API keys:
- **Agent**: Still monitors and detects trades (Fetch.ai key optional)
- **Webapp**: Uses fallback explanations instead of AI (Gemini key optional)

---

## 📝 Creating .env Files

### Agent .env:
```bash
cat > agent/.env << 'EOF'
FETCHAI_API_KEY=
SUI_RPC_URL=https://rpc-testnet.suiscan.xyz:443
COPY_TRADING_PACKAGE_ID=0x899c3fa6d4d44bd618e47707cac5030a10535da0483c2256660fef6bdf4cb657
COPY_TRADING_REGISTRY_ID=0x5a5e8d1f938aad93948cceb59dc8cf440294da805f37d754a07d2e9ac8b765f0
POLLING_INTERVAL=10
EOF
```

### Webapp .env:
```bash
cat > otter-webapp/.env << 'EOF'
VITE_GEMINI_API_KEY=
EOF
```

Then edit the files to add your actual API keys.

