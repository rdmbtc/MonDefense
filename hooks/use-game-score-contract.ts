import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import {
  PlayerStats,
  PlayerDataPerGame,
  LeaderboardEntry,
  GlobalStats
} from '@/lib/game-score-contract';
import {
  submitPlayerScore,
  ScoreSubmissionResponse,
  getCachedSessionToken,
  ScoreSubmissionManager
} from '@/lib/score-api';
import { useAuth } from './use-auth';

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
   * Submit a game score via server-side API
   */
  const submitScore = useCallback(async (
    score: number, 
    transactionCount: number = 1
  ): Promise<boolean> => {
    if (isSubmitting) return false;
    
    setIsSubmitting(true);
    
    try {
      // Ensure user is authenticated
      const networkOk = await ensureCorrectNetwork();
      if (!networkOk) {
        return false;
      }

      // Get wallet address
      const playerAddress = await getWalletAddress();
      
      // Check for cached session token first
      let currentSessionToken = getCachedSessionToken(playerAddress);
      
      // If no valid cached token, authenticate
       if (!currentSessionToken) {
         toast.info('Authenticating wallet...');
         currentSessionToken = await authenticate(playerAddress);
       }
      
      toast.info('Submitting score...');
      
      // Submit score using server-side API with session manager
      const result = await submissionManager.submitScore(
        playerAddress,
        score,
        transactionCount,
        currentSessionToken
      );
      
      if (result.success) {
        toast.success(`Score submitted successfully! Transaction: ${result.transactionHash?.slice(0, 10)}...`);
        
        // Refresh player stats after successful submission
        await fetchPlayerStats(playerAddress);
        
        return true;
      } else {
        toast.error(result.error || 'Failed to submit score');
        return false;
      }
    } catch (error: any) {
      console.error('Error submitting score:', error);
      
      // Handle specific error cases
      if (error.message?.includes('User not authenticated')) {
        toast.error('Please connect your wallet first');
      } else if (error.message?.includes('Rate limit')) {
        toast.error('Too many requests. Please wait and try again.');
      } else if (error.message?.includes('Invalid session token') || error.message?.includes('authenticate')) {
        // If authentication failed, clear cached tokens
        const playerAddress = await getWalletAddress();
        localStorage.removeItem(`session_${playerAddress}`);
        localStorage.removeItem(`session_${playerAddress}_expiry`);
        toast.error('Authentication failed. Please try again.');
      } else {
        toast.error('Failed to submit score');
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, ensureCorrectNetwork, getWalletAddress, authenticate, submissionManager]);

  /**
   * Fetch player statistics
   */
  const fetchPlayerStats = useCallback(async (address: string): Promise<void> => {
    try {
      setIsLoading(true);
      // TODO: Implement contract reading functions for the new ABI
      // For now, set placeholder data
      setPlayerStats({
        totalScore: '0',
        totalTransactions: '0',
        scorePerGame: '0',
        transactionsPerGame: '0',
        bestScore: '0',
        gamesPlayed: '0'
      });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      toast.error('Failed to fetch player statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);



  /**
   * Fetch leaderboard data
   */
  const fetchLeaderboard = useCallback(async (limit: number = 10): Promise<void> => {
    try {
      setIsLoading(true);
      // TODO: Implement leaderboard fetching for the new contract
      // For now, set empty array
      setLeaderboard([]);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to fetch leaderboard');
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
      // TODO: Implement global stats fetching for the new contract
      // For now, set placeholder data
      setGlobalStats({
        totalGames: '0',
        totalTransactions: '0',
        totalPlayers: '0'
      });
    } catch (error) {
      console.error('Error fetching global stats:', error);
      toast.error('Failed to fetch global statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Estimate transaction cost
   */
  const estimateTransactionCost = useCallback(async (score: number, transactionCount: number = 1): Promise<void> => {
    try {
      // TODO: Implement gas estimation for the new contract
      // For now, set placeholder data
      setEstimatedGasCost('0.001');
    } catch (error) {
      console.error('Error estimating transaction cost:', error);
      setEstimatedGasCost(null);
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