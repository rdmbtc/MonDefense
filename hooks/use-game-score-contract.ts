import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAuth } from '@/hooks/use-auth';
import { ethers } from 'ethers';
import {
  PlayerStats,
  PlayerDataPerGame,
  LeaderboardEntry,
  GlobalStats,
  getReadOnlyContract
} from '@/lib/game-score-contract';
import {
  submitUserGameScore,
  estimateUserGameSubmitScoreGas,
  getUserGameTopPlayers,
  getUserGamePlayerScore,
  getUserGameTotalPlayers,
  prepareUserGameScoreTransaction
} from '@/lib/user-game-contract';
import {
  submitPlayerScore,
  ScoreSubmissionResponse,
  getCachedSessionToken,
  ScoreSubmissionManager
} from '@/lib/score-api';

export interface UseGameScoreContractReturn {
  // State
  isSubmitting: boolean;
  isLoading: boolean;
  playerStats: PlayerStats | null;
  playerDataPerGame: PlayerDataPerGame | null;
  leaderboard: LeaderboardEntry[];
  globalStats: GlobalStats | null;
  isAuthenticating: boolean;
  authError: string | null;
  estimatedGasCost: string | null;
  
  // Actions
  submitScore: (score: number, transactionCount?: number) => Promise<boolean>;
  fetchPlayerStats: (address: string) => Promise<void>;
  fetchLeaderboard: (limit?: number) => Promise<void>;
  fetchGlobalStats: () => Promise<void>;
  estimateTransactionCost: (score: number, transactionCount?: number) => Promise<void>;
  authenticate: (playerAddress: string) => Promise<string>;
  ensureCorrectNetwork: () => Promise<boolean>;
}

/**
 * Custom hook for interacting with the GameScore smart contract
 * Provides functions to submit scores, fetch stats, and manage leaderboard data
 */
export function useGameScoreContract(): UseGameScoreContractReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [playerDataPerGame, setPlayerDataPerGame] = useState<PlayerDataPerGame | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [estimatedGasCost, setEstimatedGasCost] = useState<string | null>(null);
  
  // Privy hooks
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { authenticate, isAuthenticating, sessionToken, error: authError } = useAuth();
  
  // Create submission manager instance
  const [submissionManager] = useState(() => new ScoreSubmissionManager());

  /**
   * Get the current wallet address
   */
  const getWalletAddress = useCallback(async (): Promise<string> => {
    if (!authenticated || !user || wallets.length === 0) {
      throw new Error('User not authenticated or no wallet available');
    }

    const wallet = wallets[0]; // Use the first available wallet
    return wallet.address;
  }, [authenticated, user, wallets]);

  /**
   * Ensure the user is connected and authenticated with Privy
   */
  const ensureCorrectNetwork = useCallback(async (): Promise<boolean> => {
    try {
      if (!authenticated || !user) {
        toast.error('Please connect your wallet first');
        return false;
      }

      if (wallets.length === 0) {
        toast.error('No wallet available');
        return false;
      }

      // Switch to Monad testnet
      const wallet = wallets[0];
      await wallet.switchChain(10143);
      
      return true;
    } catch (error) {
      console.error('Error ensuring correct network:', error);
      toast.error('Failed to connect to Monad testnet');
      return false;
    }
  }, [authenticated, user, wallets]);

  /**
   * Fetch player statistics
   */
  const fetchPlayerStats = useCallback(async (address: string): Promise<void> => {
    try {
      setIsLoading(true);
      const playerScore = await getUserGamePlayerScore(address);
      
      // Set player stats with the score from user game contract
      setPlayerStats({
        totalScore: playerScore,
        totalTransactions: '1', // Placeholder - would need additional contract functions
        scorePerGame: playerScore, // Assuming single game for now
        transactionsPerGame: '1', // Placeholder
        bestScore: playerScore,
        gamesPlayed: playerScore === '0' ? '0' : '1' // Simple logic for now
      });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      toast.error('Failed to fetch player statistics');
      setPlayerStats({
        totalScore: '0',
        totalTransactions: '0',
        scorePerGame: '0',
        transactionsPerGame: '0',
        bestScore: '0',
        gamesPlayed: '0'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Submit a game score directly to the blockchain contract
   */
  const submitScore = useCallback(async (
    score: number, 
    transactionCount: number = 1
  ): Promise<boolean> => {
    if (isSubmitting) return false;
    
    setIsSubmitting(true);
    
    try {
      // Ensure user is authenticated and on correct network
      const networkOk = await ensureCorrectNetwork();
      if (!networkOk) {
        return false;
      }

      // Get wallet address
      const playerAddress = await getWalletAddress();
      
      // Get the wallet signer
      const wallet = wallets[0];
      if (!wallet) {
        throw new Error('No wallet available');
      }
      
      // Get ethers signer from Privy wallet - FIXED
      const provider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      
      toast.info('Submitting score to blockchain...');
      
      // Submit score through user's game contract
      const success = await submitUserGameScore(playerAddress, score, transactionCount);
      
      if (success) {
        toast.success('Score submitted successfully!');
      } else {
        throw new Error('Score submission failed');
      }
      
      // Refresh player stats after successful submission
      await fetchPlayerStats(playerAddress);
      
      return true;
    } catch (error: any) {
      console.error('Error submitting score:', error);
      
      // Handle specific error cases
      if (error.message?.includes('User not authenticated')) {
        toast.error('Please connect your wallet first');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction');
      } else if (error.message?.includes('user rejected')) {
        toast.error('Transaction was rejected');
      } else {
        toast.error(`Failed to submit score: ${error.message || 'Unknown error'}`);
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, ensureCorrectNetwork, getWalletAddress, wallets, fetchPlayerStats]);

  /**
   * Estimate transaction cost for score submission
   */
  const estimateTransactionCost = useCallback(async (
    score: number, 
    transactionCount: number = 1
  ): Promise<void> => {
    try {
      // Ensure user is authenticated and on correct network
      const networkOk = await ensureCorrectNetwork();
      if (!networkOk) {
        return;
      }

      // Get the wallet signer
      const wallet = wallets[0];
      if (!wallet) {
        throw new Error('No wallet available');
      }
      
      // Get ethers signer from Privy wallet - FIXED
      const provider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      
      // Get fee data - FIXED
      const feeData = await ethersProvider.getFeeData();
      
      // Get wallet address
      const playerAddress = await getWalletAddress();
      
      // Estimate gas for the transaction through user game contract
      const estimatedGas = await estimateUserGameSubmitScoreGas(playerAddress, score, transactionCount);
      
      // Calculate estimated cost
      const gasPrice = feeData.gasPrice || ethers.parseUnits('1', 'gwei');
      const estimatedCost = estimatedGas * gasPrice;
      
      // Convert to readable format (MON)
      const costInMON = ethers.formatEther(estimatedCost);
      setEstimatedGasCost(costInMON);
      
      console.log('Estimated transaction cost:', costInMON, 'MON');
    } catch (error) {
      console.error('Error estimating transaction cost:', error);
      setEstimatedGasCost(null);
    }
  }, [ensureCorrectNetwork, wallets]);

  /**
   * Fetch leaderboard data
   */
  const fetchLeaderboard = useCallback(async (limit: number = 10): Promise<void> => {
    try {
      setIsLoading(true);
      const topPlayers = await getUserGameTopPlayers(limit);
      const leaderboardData = topPlayers.map((player, index) => ({
        rank: index + 1,
        address: player.player,
        score: player.score,
        username: null // Username would need to be fetched separately if needed
      }));
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to fetch leaderboard');
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch global statistics
   */
  const fetchGlobalStats = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const totalPlayers = await getUserGameTotalPlayers();
      
      // Calculate total games and transactions by summing from all players
      // For now, we'll use basic stats until we add more contract functions
      setGlobalStats({
        totalGames: '0', // Would need additional contract function
        totalTransactions: '0', // Would need additional contract function  
        totalPlayers: totalPlayers.toString()
      });
    } catch (error) {
      console.error('Error fetching global stats:', error);
      toast.error('Failed to fetch global statistics');
      setGlobalStats({
        totalGames: '0',
        totalTransactions: '0',
        totalPlayers: '0'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    isSubmitting,
    isLoading,
    playerStats,
    playerDataPerGame,
    leaderboard,
    globalStats,
    isAuthenticating,
    authError,
    estimatedGasCost,
    
    // Actions
    submitScore,
    fetchPlayerStats,
    fetchLeaderboard,
    fetchGlobalStats,
    estimateTransactionCost,
    authenticate,
    ensureCorrectNetwork
  };
}

export default useGameScoreContract;