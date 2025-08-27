/**
 * Script to check if a wallet has GAME_ROLE permission on the Monad Games contract
 * Usage: node scripts/check-game-role.js <wallet-address>
 */

const { createPublicClient, http } = require('viem');
const { monadTestnet } = require('viem/chains');

// Contract configuration
const GAME_SCORE_CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
const GAME_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000001';

// Minimal ABI for checking roles
const MINIMAL_ABI = [
  {
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' }
    ],
    name: 'hasRole',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'GAME_ROLE',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// Create public client
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http('https://testnet-rpc.monad.xyz')
});

async function checkGameRole(walletAddress) {
  try {
    console.log(`Checking GAME_ROLE permission for wallet: ${walletAddress}`);
    console.log(`Contract address: ${GAME_SCORE_CONTRACT_ADDRESS}`);
    console.log('---');

    // Check if wallet has GAME_ROLE
    const hasRole = await publicClient.readContract({
      address: GAME_SCORE_CONTRACT_ADDRESS,
      abi: MINIMAL_ABI,
      functionName: 'hasRole',
      args: [GAME_ROLE, walletAddress]
    });

    if (hasRole) {
      console.log('✅ SUCCESS: Wallet has GAME_ROLE permission!');
      console.log('The wallet can successfully call updatePlayerData function.');
    } else {
      console.log('❌ MISSING: Wallet does NOT have GAME_ROLE permission.');
      console.log('');
      console.log('To grant GAME_ROLE permission:');
      console.log('1. Contact the contract admin/owner');
      console.log('2. Ask them to call: grantRole(GAME_ROLE, "' + walletAddress + '")');
      console.log('3. Or use a wallet that already has GAME_ROLE permission');
      console.log('');
      console.log('GAME_ROLE value:', GAME_ROLE);
    }

  } catch (error) {
    console.error('Error checking GAME_ROLE:', error.message);
    
    if (error.message.includes('Invalid address')) {
      console.log('Please provide a valid Ethereum address.');
    } else if (error.message.includes('network')) {
      console.log('Network error. Please check your internet connection.');
    }
  }
}

// Get wallet address from command line arguments
const walletAddress = process.argv[2];

if (!walletAddress) {
  console.log('Usage: node scripts/check-game-role.js <wallet-address>');
  console.log('Example: node scripts/check-game-role.js 0x1234567890123456789012345678901234567890');
  process.exit(1);
}

// Validate address format
if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
  console.log('Error: Invalid wallet address format.');
  console.log('Address should be 42 characters long and start with 0x');
  process.exit(1);
}

// Run the check
checkGameRole(walletAddress)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });