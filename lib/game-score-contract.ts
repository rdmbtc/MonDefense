import { ethers } from 'ethers';

// GameScore contract address on Monad testnet
export const GAME_SCORE_CONTRACT_ADDRESS = '0x7245450F0D040Ea3e0658e7ae02DCF3BF999E578';

// Monad testnet RPC URL
const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz';

// GameScore contract ABI (only the functions we need)
const GAME_SCORE_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_score", "type": "uint256" },
      { "internalType": "uint256", "name": "_transactionCount", "type": "uint256" }
    ],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_player", "type": "address" }],
    "name": "getPlayerScore",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "highestScore", "type": "uint256" },
          { "internalType": "uint256", "name": "totalGamesPlayed", "type": "uint256" },
          { "internalType": "uint256", "name": "totalTransactions", "type": "uint256" },
          { "internalType": "uint256", "name": "lastGameTimestamp", "type": "uint256" },
          { "internalType": "bool", "name": "exists", "type": "bool" }
        ],
        "internalType": "struct GameScore.PlayerScore",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getGlobalStats",
    "outputs": [
      { "internalType": "uint256", "name": "totalGames", "type": "uint256" },
      { "internalType": "uint256", "name": "totalTransactions", "type": "uint256" },
      { "internalType": "uint256", "name": "totalPlayers", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "limit", "type": "uint256" }],
    "name": "getTopPlayers",
    "outputs": [
      { "internalType": "address[]", "name": "players", "type": "address[]" },
      { "internalType": "uint256[]", "name": "scores", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "score", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "transactionCount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "ScoreSubmitted",
    "type": "event"
  }
];

export interface PlayerStats {
  totalScore: string;
  gamesPlayed: string;
  totalTransactions: string;
  bestScore: string;
}

export interface GlobalStats {
  totalGames: string;
  totalTransactions: string;
  totalPlayers: string;
}

export interface LeaderboardEntry {
  address: string;
  score: string;
}

/**
 * Get a read-only contract instance for querying data
 */
function getReadOnlyContract() {
  const provider = new ethers.JsonRpcProvider(MONAD_TESTNET_RPC);
  return new ethers.Contract(GAME_SCORE_CONTRACT_ADDRESS, GAME_SCORE_ABI, provider);
}

/**
 * Get a contract instance with signer for transactions
 */
function getContractWithSigner(signer: ethers.Signer) {
  return new ethers.Contract(GAME_SCORE_CONTRACT_ADDRESS, GAME_SCORE_ABI, signer);
}

/**
 * Submit a game score to the blockchain
 * @param signer - Ethereum signer (wallet)
 * @param score - Game score to submit
 * @param transactionCount - Number of transactions made during the game
 * @returns Transaction hash
 */
export async function submitGameScore(
  signer: ethers.Signer,
  score: number,
  transactionCount: number = 1
): Promise<string> {
  try {
    const contract = getContractWithSigner(signer);
    const tx = await contract.submitScore(score, transactionCount);
    
    console.log('Score submission transaction sent:', tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log('Score submitted successfully:', receipt.hash);
    
    return receipt.hash;
  } catch (error) {
    console.error('Error submitting score:', error);
    throw error;
  }
}

/**
 * Get player statistics from the contract
 * @param playerAddress - Player's wallet address
 * @returns Player statistics
 */
export async function getPlayerStats(playerAddress: string): Promise<PlayerStats> {
  try {
    const contract = getReadOnlyContract();
    const playerScore = await contract.getPlayerScore(playerAddress);
    
    return {
      totalScore: playerScore.totalTransactions.toString(), // Using totalTransactions as totalScore
      gamesPlayed: playerScore.totalGamesPlayed.toString(),
      totalTransactions: playerScore.totalTransactions.toString(),
      bestScore: playerScore.highestScore.toString()
    };
  } catch (error) {
    console.error('Error fetching player stats:', error);
    throw error;
  }
}

/**
 * Get global game statistics
 * @returns Global statistics
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  try {
    const contract = getReadOnlyContract();
    const stats = await contract.getGlobalStats();
    
    return {
      totalGames: stats[0].toString(),
      totalTransactions: stats[1].toString(),
      totalPlayers: stats[2].toString()
    };
  } catch (error) {
    console.error('Error fetching global stats:', error);
    throw error;
  }
}

/**
 * Get top players leaderboard
 * @param limit - Number of top players to fetch (default: 10)
 * @returns Array of leaderboard entries
 */
export async function getTopPlayers(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const contract = getReadOnlyContract();
    const result = await contract.getTopPlayers(limit);
    
    const players = result[0];
    const scores = result[1];
    
    return players.map((address: string, index: number) => ({
      address,
      score: scores[index].toString()
    }));
  } catch (error) {
    console.error('Error fetching top players:', error);
    throw error;
  }
}

/**
 * Check if the user's wallet is connected to Monad testnet
 * @param provider - Ethereum provider
 * @returns True if connected to Monad testnet
 */
export async function isConnectedToMonadTestnet(provider: ethers.Provider): Promise<boolean> {
  try {
    const network = await provider.getNetwork();
    // Monad testnet chain ID is 10143 (0x279f)
    return network.chainId === 10143n;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
}

/**
 * Switch to Monad testnet (for MetaMask-like wallets)
 */
export async function switchToMonadTestnet() {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa1de' }], // 41454 in hex
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xa1de',
                chainName: 'Monad Testnet',
                nativeCurrency: {
                  name: 'MON',
                  symbol: 'MON',
                  decimals: 18,
                },
                rpcUrls: [MONAD_TESTNET_RPC],
                blockExplorerUrls: ['https://testnet-explorer.monad.xyz'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding Monad testnet:', addError);
          throw addError;
        }
      } else {
        console.error('Error switching to Monad testnet:', switchError);
        throw switchError;
      }
    }
  }
}

export { GAME_SCORE_CONTRACT_ADDRESS, MONAD_TESTNET_RPC };