# Sui Transaction Explorer

A web application that analyzes Sui blockchain transactions and explains what happened in plain language.

## What it does

This tool takes any Sui transaction hash and breaks down the transaction into human-readable descriptions. Instead of showing raw blockchain data, it explains what actually occurred - which objects were created, transferred, or modified, and how much gas was used.

## Features

- **Transaction Analysis**: Paste any Sui transaction hash to see a detailed breakdown
- **Smart Descriptions**: Converts technical blockchain operations into plain English
- **Protocol Recognition**: Identifies which DeFi protocols were used (Cetus, Turbos, Kriya, etc.)
- **Token Detection**: Shows which tokens were involved (SUI, USDC, USDT, etc.)
- **Interactive Addresses**: Click on addresses to expand, copy, or view on blockchain explorer
- **Live Data**: Fetch recent transactions from the blockchain for testing

## How it works

The application connects to the Sui mainnet and fetches transaction details using the Sui RPC API. It then parses the transaction data to identify:

- Object changes (created, mutated, transferred, deleted)
- Balance changes for different tokens
- Smart contract function calls
- Gas usage and fees
- Participant addresses

The parsing logic recognizes common DeFi protocols and token types to provide meaningful descriptions instead of generic technical details.

## Usage

1. Enter a Sui transaction hash in the input field
2. Click "Analyze" to fetch and parse the transaction
3. Review the step-by-step breakdown of what occurred
4. Use the "Fetch Recent Transactions" button to test with live data

## Technical Details

- Built with Next.js and TypeScript
- Uses the Sui TypeScript SDK for blockchain interaction
- Implements smart parsing of object types and protocol recognition
- Provides expandable addresses with copy and explorer link functionality

## Supported Protocols

The explorer recognizes transactions from major Sui DeFi protocols including Cetus, Turbos, Kriya, Bluefin, and others. It can identify liquidity pools, trading operations, token transfers, and smart contract interactions.