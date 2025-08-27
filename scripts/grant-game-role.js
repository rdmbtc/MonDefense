const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { monadTestnet } = require('viem/chains');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Contract configuration
const GAME_SCORE_CONTRACT_ADDRESS = '0x33D8711368801358714Dc11d03c1c130ba5CA342';
const GAME_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000001';

// Load contract ABI
const contractArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'nooter contract', 'artifacts', 'contracts', 'GameScore.sol', 'GameScore.json'), 'utf8')
);
const contractABI = contractArtifact.abi;

async function grantGameRole() {
  try {
    // Get private key from environment
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey || privateKey === "0x0000000000000000000000000000000000000000000000000000000000000001") {
      throw new Error('Please set PRIVATE_KEY in your .env file');
    }

    // Create account from private key
    const account = privateKeyToAccount(privateKey);
    console.log(`Granting GAME_ROLE from wallet: ${account.address}`);
    console.log(`Contract address: ${GAME_SCORE_CONTRACT_ADDRESS}`);
    console.log('---');

    // Create wallet client
    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http('https://testnet-rpc.monad.xyz')
    });

    // Grant GAME_ROLE to the wallet
    console.log('Granting GAME_ROLE...');
    const hash = await walletClient.writeContract({
      address: GAME_SCORE_CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'grantRole',
      args: [GAME_ROLE, account.address]
    });

    console.log(`✅ Transaction sent: ${hash}`);
    console.log('Waiting for confirmation...');

    // Create public client to wait for transaction
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http('https://testnet-rpc.monad.xyz')
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    console.log(`✅ GAME_ROLE granted successfully to ${account.address}`);

  } catch (error) {
    console.error('Error granting GAME_ROLE:', error.message);
    process.exit(1);
  }
}

// Run the script
grantGameRole();