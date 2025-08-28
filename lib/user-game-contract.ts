import { ethers } from 'ethers';
import { toast } from 'sonner';

// User's registered game contract address on Monad testnet
export const USER_GAME_CONTRACT_ADDRESS = '0x33D8711368801358714Dc11d03c1c130ba5CA342';

// Monad testnet RPC URL
const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz';

// ABI for the user's game contract that calls updatePlayerData on Monad Games contract
export const USER_GAME_CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "scoreAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "transactionAmount",
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
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getPlayerScore",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getTopPlayers",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "player",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "score",
            "type": "uint256"
          }
        ],
        "internalType": "struct IMonadGames.PlayerScore[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalPlayers",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export interface UserGameTransactionData {
  gasLimit: bigint;
  gasPrice: bigint;
  estimatedCost: string;
  nonce: number;
}

/**
 * Get a read-only contract instance for view functions
 */
export function getUserGameReadOnlyContract() {
  const provider = new ethers.JsonRpcProvider(MONAD_TESTNET_RPC);
  return new ethers.Contract(USER_GAME_CONTRACT_ADDRESS, USER_GAME_CONTRACT_ABI, provider);
}

/**
 * Get a contract instance with signer for transactions
 */
export function getUserGameContractWithSigner(signer: ethers.Signer) {
  return new ethers.Contract(USER_GAME_CONTRACT_ADDRESS, USER_GAME_CONTRACT_ABI, signer);
}

/**
 * Estimate gas for score submission through user's game contract
 */
export async function estimateUserGameSubmitScoreGas(
  signer: ethers.Signer,
  playerAddress: string,
  score: number,
  transactionCount: number = 1
): Promise<bigint> {
  try {
    const contract = getUserGameContractWithSigner(signer);
    const gasEstimate = await contract.submitScore.estimateGas(
      playerAddress,
      score,
      transactionCount
    );
    return gasEstimate;
  } catch (error) {
    console.error('Error estimating gas for user game contract:', error);
    throw error;
  }
}

/**
 * Prepare transaction data for score submission through user's game contract
 */
export async function prepareUserGameScoreTransaction(
  signer: ethers.Signer,
  playerAddress: string,
  score: number,
  transactionCount: number = 1
): Promise<UserGameTransactionData> {
  try {
    const contract = getUserGameContractWithSigner(signer);
    const provider = signer.provider;
    if (!provider) {
      throw new Error('Signer provider not available');
    }

    // Get gas estimate
    const gasLimit = await contract.submitScore.estimateGas(
      playerAddress,
      score,
      transactionCount
    );

    // Get current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

    // Calculate estimated cost
    const estimatedCost = ethers.formatEther(gasLimit * gasPrice);

    // Get nonce
    const nonce = await provider.getTransactionCount(await signer.getAddress());

    return {
      gasLimit,
      gasPrice,
      estimatedCost,
      nonce
    };
  } catch (error) {
    console.error('Error preparing user game transaction:', error);
    throw error;
  }
}

/**
 * Submit score through user's game contract
 */
export async function submitUserGameScore(
  signer: ethers.Signer,
  playerAddress: string,
  score: number,
  transactionCount: number = 1
): Promise<boolean> {
  try {
    console.log('Submitting score through user game contract:', {
      playerAddress,
      score,
      transactionCount,
      contractAddress: USER_GAME_CONTRACT_ADDRESS
    });

    // Prepare transaction data
    const txData = await prepareUserGameScoreTransaction(signer, playerAddress, score, transactionCount);
    
    console.log('Transaction data:', {
      gasLimit: txData.gasLimit.toString(),
      gasPrice: txData.gasPrice.toString(),
      estimatedCost: txData.estimatedCost,
      nonce: txData.nonce
    });

    // Get contract with signer
    const contract = getUserGameContractWithSigner(signer);

    // Submit the transaction
    const tx = await contract.submitScore(
      playerAddress,
      score,
      transactionCount,
      {
        gasLimit: txData.gasLimit,
        gasPrice: txData.gasPrice,
        nonce: txData.nonce
      }
    );

    console.log('Transaction submitted:', tx.hash);
    toast.info(`Transaction submitted: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    if (receipt.status === 1) {
      console.log('Score submission successful!');
      return true;
    } else {
      console.error('Transaction failed');
      return false;
    }
  } catch (error) {
    console.error('Error submitting score through user game contract:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('user rejected')) {
        toast.error('Transaction was rejected by user');
      } else if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction');
      } else {
        toast.error(`Transaction failed: ${error.message}`);
      }
    } else {
      toast.error('Unknown error occurred during transaction');
    }
    
    return false;
  }
}

/**
 * Get player score from user's game contract
 */
export async function getUserGamePlayerScore(playerAddress: string): Promise<string> {
  try {
    const contract = getUserGameReadOnlyContract();
    const score = await contract.getPlayerScore(playerAddress);
    return score.toString();
  } catch (error) {
    console.error('Error fetching player score from user game contract:', error);
    return '0';
  }
}

/**
 * Get top players from user's game contract
 */
export async function getUserGameTopPlayers(limit: number = 10): Promise<Array<{player: string, score: string}>> {
  try {
    const contract = getUserGameReadOnlyContract();
    const topPlayers = await contract.getTopPlayers(limit);
    
    return topPlayers.map((player: any) => ({
      player: player.player,
      score: player.score.toString()
    }));
  } catch (error) {
    console.error('Error fetching top players from user game contract:', error);
    return [];
  }
}

/**
 * Get total players from user's game contract
 */
export async function getUserGameTotalPlayers(): Promise<number> {
  try {
    const contract = getUserGameReadOnlyContract();
    const totalPlayers = await contract.getTotalPlayers();
    return parseInt(totalPlayers.toString());
  } catch (error) {
    console.error('Error fetching total players from user game contract:', error);
    return 0;
  }
}