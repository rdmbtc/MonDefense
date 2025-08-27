# GAME_ROLE Setup Guide

This guide explains how to set up the required GAME_ROLE permission for your MonDefense game to work with the official Monad Games contract.

## Overview

The MonDefense game now uses the official Monad Games contract at `0x33D8711368801358714Dc11d03c1c130ba5CA342`. To submit scores, your server-side wallet must have `GAME_ROLE` permission on this contract.

## Step 1: Generate a Game Wallet

You need a dedicated wallet for server-side operations:

```bash
# Install viem CLI (if not already installed)
npm install -g viem

# Generate a new wallet
node -e "const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts'); const pk = generatePrivateKey(); const account = privateKeyToAccount(pk); console.log('Private Key:', pk); console.log('Address:', account.address);"
```

**⚠️ SECURITY WARNING**: Keep the private key secure and never commit it to version control!

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your game wallet private key to `.env`:
   ```env
   GAME_WALLET_PRIVATE_KEY=0x1234567890abcdef...
   ```

3. Configure other required variables:
   ```env
   NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
   ```

## Step 3: Fund Your Game Wallet

Your game wallet needs MON tokens to pay for transaction fees:

1. Visit the [Monad Testnet Faucet](https://faucet.monad.xyz/)
2. Enter your game wallet address
3. Request testnet MON tokens

## Step 4: Check GAME_ROLE Permission

Use the provided script to check if your wallet has the required permission:

```bash
# Install dependencies first
npm install

# Check GAME_ROLE permission
node scripts/check-game-role.js YOUR_GAME_WALLET_ADDRESS
```

Example:
```bash
node scripts/check-game-role.js 0x1234567890123456789012345678901234567890
```

## Step 5: Request GAME_ROLE Permission

If your wallet doesn't have GAME_ROLE permission, you need to contact the contract admin:

### Option A: Contact Monad Team
1. Join the [Monad Discord](https://discord.gg/monad)
2. Request GAME_ROLE permission for your wallet address
3. Provide your game details and wallet address

### Option B: Self-Grant (If you have admin access)
If you have admin access to the contract:

```javascript
// Using viem
const GAME_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000001';

await walletClient.writeContract({
  address: '0x33D8711368801358714Dc11d03c1c130ba5CA342',
  abi: contractABI,
  functionName: 'grantRole',
  args: [GAME_ROLE, 'YOUR_GAME_WALLET_ADDRESS']
});
```

## Step 6: Verify Setup

1. Run the permission check again:
   ```bash
   node scripts/check-game-role.js YOUR_GAME_WALLET_ADDRESS
   ```

2. Start your development server:
   ```bash
   npm run dev
   ```

3. Test score submission in your game

## Troubleshooting

### "Server wallet lacks required permissions"
- Your wallet doesn't have GAME_ROLE permission
- Follow Step 5 to request permission

### "Insufficient funds for transaction"
- Your game wallet needs more MON tokens
- Visit the faucet to get more tokens

### "Invalid private key format"
- Ensure your private key starts with `0x`
- Private key should be 64 characters long (plus `0x` prefix)

### "Network connection failed"
- Check your internet connection
- Verify RPC URL is correct: `https://testnet-rpc.monad.xyz`

## Security Best Practices

1. **Never commit private keys** to version control
2. **Use environment variables** for sensitive data
3. **Rotate keys regularly** in production
4. **Monitor wallet balance** and transaction activity
5. **Use separate wallets** for different environments (dev/staging/prod)

## Contract Information

- **Contract Address**: `0x33D8711368801358714Dc11d03c1c130ba5CA342`
- **Network**: Monad Testnet (Chain ID: 10143)
- **RPC URL**: `https://testnet-rpc.monad.xyz`
- **GAME_ROLE**: `0x0000000000000000000000000000000000000000000000000000000000000001`

## Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure your wallet has sufficient MON tokens
4. Join the Monad Discord for community support