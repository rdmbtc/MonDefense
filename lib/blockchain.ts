import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import { monadTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { GAME_CONFIG } from './game-config';
import { CONTRACT_ABI } from '../utils/abi';

// Monad Games ID Contract ABI for UpdatePlayerData
const MONAD_GAMES_ID_ABI = [
  {
    inputs: [
      { name: "gameId", type: "uint256" },
      { name: "player", type: "address" },
      { name: "score", type: "uint256" },
      { name: "transactionCount", type: "uint256" }
    ],
    name: "UpdatePlayerData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Create public client for reading
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

// Create wallet client for writing (requires private key)
export function createSignerClient(privateKey: string) {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  
  return createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(),
  });
}

// Update player data on Monad Games ID smart contract
export async function updatePlayerDataOnChain(
  playerAddress: string,
  score: number,
  transactionCount: number,
  signerPrivateKey?: string
) {
  try {
    // Use environment variable for private key if not provided
    const privateKey = signerPrivateKey || process.env.SIGNER_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('No signer private key provided');
    }

    const walletClient = createSignerClient(privateKey);
    
    // Call UpdatePlayerData on Monad Games ID contract
    const hash = await walletClient.writeContract({
      address: GAME_CONFIG.BLOCKCHAIN.MONAD_GAMES_ID_CONTRACT as `0x${string}`,
      abi: MONAD_GAMES_ID_ABI,
      functionName: 'UpdatePlayerData',
      args: [
        BigInt(GAME_CONFIG.BLOCKCHAIN.GAME_ID), // gameId
        playerAddress as `0x${string}`, // player address
        BigInt(score), // score
        BigInt(transactionCount) // transaction count
      ],
    });

    console.log('UpdatePlayerData transaction hash:', hash);
    
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    return {
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed
    };
  } catch (error) {
    console.error('Error updating player data on-chain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Read player total score from original contract (for backward compatibility)
export async function getPlayerTotalScore(playerAddress: string) {
  try {
    const totalScore = await publicClient.readContract({
      address: GAME_CONFIG.GAME_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'totalScoreOfPlayer',
      args: [playerAddress as `0x${string}`],
    }) as bigint;

    return {
      success: true,
      totalScore: totalScore.toString()
    };
  } catch (error) {
    console.error('Error reading player total score:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Utility function to validate wallet address
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Utility function to format transaction hash for display
export function formatTransactionHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}