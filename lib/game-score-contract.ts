import { ethers } from 'ethers';

// Official Monad Games contract address on Monad testnet
export const GAME_SCORE_CONTRACT_ADDRESS = '0x33D8711368801358714Dc11d03c1c130ba5CA342';

// Monad testnet RPC URL
export const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz';

// Official Monad Games contract ABI
const GAME_SCORE_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_score",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_transactionCount",
        "type": "uint256"
      }
    ],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "playerDataPerGame",
    "outputs": [
      { "internalType": "uint256", "name": "score", "type": "uint256" },
      { "internalType": "uint256", "name": "transactions", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "totalScoreOfPlayer",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "totalTransactionsOfPlayer",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "game", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "scoreAmount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "transactionAmount", "type": "uint256" }
    ],
    "name": "PlayerDataUpdated",
    "type": "event"
  }
] as const;

// Export the ABI for use in other files
export { GAME_SCORE_ABI };

export interface PlayerStats {
  totalScore: string;
  totalTransactions: string;
  scorePerGame: string;
  transactionsPerGame: string;
  bestScore: string;
  gamesPlayed: string;
}

export interface GlobalStats {
  totalGames: string;
  totalTransactions: string;
  totalPlayers: string;
}

export interface PlayerDataPerGame {
  score: string;
  transactions: string;
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
 * Estimate gas for score submission transaction
 * @param signer - Ethereum signer
 * @param score - Game score
 * @param transactionCount - Transaction count
 * @returns Estimated gas limit
 */
export async function estimateSubmitScoreGas(
  signer: ethers.Signer,
  score: number,
  transactionCount: number = 1
): Promise<bigint> {
  try {
    const contract = getContractWithSigner(signer);
    const estimatedGas = await contract.submitScore.estimateGas(score, transactionCount);
    
    // Add 20% buffer to estimated gas for safety
    const gasWithBuffer = (estimatedGas * 120n) / 100n;
    
    console.log('Estimated gas:', estimatedGas.toString());
    console.log('Gas with buffer:', gasWithBuffer.toString());
    
    return gasWithBuffer;
  } catch (error) {
    console.warn('Gas estimation failed, using default:', error);
    // Return conservative default if estimation fails
    return 200000n;
  }
}

/**
 * Prepare transaction data for score submission
 * @param signer - Ethereum signer
 * @param score - Game score
 * @param transactionCount - Transaction count
 * @returns Transaction preparation data
 */
export async function prepareScoreTransaction(
  signer: ethers.Signer,
  score: number,
  transactionCount: number = 1
) {
  const provider = signer.provider;
  
  // Get network fee data
  let feeData;
  try {
    feeData = await provider?.getFeeData();
  } catch (e) {
    console.warn('Could not fetch fee data, using defaults');
  }
  
  // Estimate gas for this specific transaction
  const estimatedGas = await estimateSubmitScoreGas(signer, score, transactionCount);
  
  // Use estimated gas or conservative default
  const gasLimit = estimatedGas > 0n ? estimatedGas : 200000n;
  
  // Set gas price (Monad testnet typically has very low gas prices)
  const gasPrice = feeData?.gasPrice || ethers.parseUnits('1', 'gwei');
  
  // Get current nonce
  const nonce = await signer.getNonce('pending');
  
  return {
    gasLimit,
    gasPrice,
    nonce,
    estimatedCost: gasLimit * gasPrice
  };
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
    
    // Prepare transaction with optimized gas settings
    console.log('Preparing transaction for score submission...');
    const txData = await prepareScoreTransaction(signer, score, transactionCount);
    
    console.log('Transaction preparation complete:');
    console.log('- Gas limit:', txData.gasLimit.toString());
    console.log('- Gas price:', txData.gasPrice.toString());
    console.log('- Estimated cost:', ethers.formatEther(txData.estimatedCost), 'MON');
    console.log('- Nonce:', txData.nonce);
    
    // Submit transaction with prepared settings
    const tx = await contract.submitScore(score, transactionCount, {
      gasLimit: txData.gasLimit,
      gasPrice: txData.gasPrice,
      nonce: txData.nonce
    });
    
    console.log('Score submission transaction sent:', tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait(1); // Wait for 1 confirmation
    console.log('Score submitted successfully!');
    console.log('- Transaction hash:', receipt.hash);
    console.log('- Gas used:', receipt.gasUsed.toString());
    console.log('- Gas efficiency:', ((Number(receipt.gasUsed) / Number(txData.gasLimit)) * 100).toFixed(1) + '%');
    
    return receipt.hash;
  } catch (error: any) {
    console.error('Error submitting score:', error);
    
    // Enhanced error handling for common Monad issues
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient MON tokens for transaction. Please check your wallet balance.');
    } else if (error.code === 'NONCE_EXPIRED' || error.code === 'REPLACEMENT_UNDERPRICED') {
      throw new Error('Transaction nonce issue. Please try again.');
    } else if (error.message?.includes('gas')) {
      throw new Error('Gas estimation failed. The transaction may require more gas or the contract call may revert.');
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network connection issue. Please check your connection to Monad testnet.');
    } else if (error.code === 'CALL_EXCEPTION') {
      throw new Error('Contract call failed. Please check if the contract is deployed and accessible.');
    }
    
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
    
    const gamesPlayed = parseInt(playerScore.totalGamesPlayed.toString());
    const totalTransactions = parseInt(playerScore.totalTransactions.toString());
    
    return {
      totalScore: playerScore.totalTransactions.toString(), // Using totalTransactions as totalScore
      gamesPlayed: playerScore.totalGamesPlayed.toString(),
      totalTransactions: playerScore.totalTransactions.toString(),
      bestScore: playerScore.highestScore.toString(),
      scorePerGame: gamesPlayed > 0 ? (totalTransactions / gamesPlayed).toFixed(2) : '0',
      transactionsPerGame: gamesPlayed > 0 ? (totalTransactions / gamesPlayed).toFixed(2) : '0'
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
        params: [{ chainId: '0x279f' }], // 10143 in hex (correct Monad testnet chain ID)
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x279f', // 10143 in hex (correct Monad testnet chain ID)
                chainName: 'Monad Testnet',
                nativeCurrency: {
                  name: 'MON',
                  symbol: 'MON',
                  decimals: 18,
                },
                rpcUrls: [MONAD_TESTNET_RPC],
                blockExplorerUrls: ['https://testnet.monadexplorer.com'],
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