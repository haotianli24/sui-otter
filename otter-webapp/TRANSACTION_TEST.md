# Transaction Detection Test

## Test Cases

Try sending these messages in the chat to test transaction detection:

### Sui Transaction Digests (Base58)
```
2k5J8abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789
```

```
Hello! Check out this transaction: 2k5J8abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789
```

### Hex Transaction Hashes
```
0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

```
Transaction completed: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Mixed Content
```
Just sent some SUI! Transaction: 2k5J8abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789
```

## Expected Behavior

- Messages containing transaction digests should show a small toggle button below the message
- The toggle button shows "Hide Transaction" by default (embed is visible)
- Clicking the toggle button shows/hides the transaction embed
- The embed displays transaction details, gas usage, and AI explanation
- Copy button should work to copy the digest
- Loading states should be shown while fetching transaction data
- Toggle button only appears on messages with transaction digests

## Troubleshooting

If transaction detection is not working:

1. Check browser console for any errors
2. Verify the message contains a valid digest format
3. Check if the TransactionEmbed component is rendering
4. Verify the .env file has the GEMINI_API_KEY set (optional)
