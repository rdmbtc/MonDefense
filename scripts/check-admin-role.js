/**
 * Script to check who has admin privileges on the Monad Games contract
 * Usage: node scripts/check-admin-role.js
 */

const { createPublicClient, http } = require('viem');
const { monadTestnet } = require('viem/chains');

// Contract configuration
const GAME_SCORE_CONTRACT_ADDRESS = '0x33D8711368801358714Dc11d03c1c130ba5CA342';
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const GAME_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000001';

// Minimal ABI for checking roles and admin functions
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
    inputs: [
      { name: 'role', type: 'bytes32' }
    ],
    name: 'getRoleAdmin',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
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

async function checkAdminRoles() {
  try {
    console.log(`Checking admin roles for contract: ${GAME_SCORE_CONTRACT_ADDRESS}`);
    console.log('---');

    // Try to get contract owner
    try {
      const owner = await publicClient.readContract({
        address: GAME_SCORE_CONTRACT_ADDRESS,
        abi: MINIMAL_ABI,
        functionName: 'owner'
      });
      console.log('✅ Contract Owner:', owner);
    } catch (error) {
      console.log('❌ Could not fetch contract owner (function may not exist)');
    }

    // Try to get DEFAULT_ADMIN_ROLE value
    try {
      const defaultAdminRole = await publicClient.readContract({
        address: GAME_SCORE_CONTRACT_ADDRESS,
        abi: MINIMAL_ABI,
        functionName: 'DEFAULT_ADMIN_ROLE'
      });
      console.log('✅ DEFAULT_ADMIN_ROLE value:', defaultAdminRole);
    } catch (error) {
      console.log('❌ Could not fetch DEFAULT_ADMIN_ROLE (using standard value)');
      console.log('Using standard DEFAULT_ADMIN_ROLE:', DEFAULT_ADMIN_ROLE);
    }

    // Check who can admin GAME_ROLE
    try {
      const gameRoleAdmin = await publicClient.readContract({
        address: GAME_SCORE_CONTRACT_ADDRESS,
        abi: MINIMAL_ABI,
        functionName: 'getRoleAdmin',
        args: [GAME_ROLE]
      });
      console.log('✅ GAME_ROLE admin role:', gameRoleAdmin);
    } catch (error) {
      console.log('❌ Could not fetch GAME_ROLE admin');
    }

    console.log('\n--- Instructions ---');
    console.log('To grant GAME_ROLE to your wallet, you need:');
    console.log('1. A wallet that has DEFAULT_ADMIN_ROLE or is the contract owner');
    console.log('2. Call grantRole(GAME_ROLE, YOUR_WALLET_ADDRESS) from that wallet');
    console.log('3. Or contact the Monad team via Discord to request GAME_ROLE');
    console.log('\nYour current wallet: 0xD138925168aD03fEe0Cca73cD949F1077C82c093');
    console.log('GAME_ROLE value:', GAME_ROLE);

  } catch (error) {
    console.error('Error checking admin roles:', error.message);
    
    if (error.message.includes('network')) {
      console.log('Network error. Please check your internet connection.');
    }
  }
}

// Run the check
checkAdminRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });