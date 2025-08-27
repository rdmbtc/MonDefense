import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import {
  submitGameScore,
  getPlayerStats,
  getGlobalStats,
  getTopPlayers,
  PlayerStats,
  GlobalStats,
  LeaderboardEntry,
  GAME_SCORE_CONTRACT_ADDRESS
} from '@/lib/game-score-contract';

export interface UseGameScoreContractReturn {
  // State
  isSubmitting: boolean;
  isLoading: boolean;
  playerStats: PlayerStats | null;
  globalStats: GlobalStats | null;
  leaderboard: LeaderboardEntry[];
  
  // Actions
  submitScore: (score: number, transactionCount?: number) => Promise<boolean>;
  fetchPlayerStats: (address: string) => Promise<void>;
  fetchGlobalStats: () => Promise<void>;
  fetchLeaderboard: (limit?: number) => Promise<void>;
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
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  // Privy hooks
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  /**
   * Get Privy wallet provider and signer
   */
  const getPrivyWallet = useCallback(async () => {
    if (!authenticated || !user || wallets.length === 0) {
      throw new Error('User not authenticated or no wallet available');
    }

    const wallet = wallets[0]; // Use the first available wallet
    await wallet.switchChain(41454); // Switch to Monad testnet (chain ID 41454)
    
    const provider = await wallet.getEthereumProvider();
    const signer = await (new ethers.BrowserProvider(provider)).getSigner();
    
    return { provider, signer };
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
      await wallet.switchChain(41454);
      
      return true;
    } catch (error) {
      console.error('Error ensuring correct network:', error);
      toast.error('Failed to connect to Monad testnet');
      return false;
    }
  }, [authenticated, user, wallets]);

  /**
   * Submit a game score to the blockchain using Privy
   */
  const submitScore = useCallback(async (
    score: number, 
    transactionCount: number = 1
  ): Promise<boolean> => {
    if (isSubmitting) return false;
    
    setIsSubmitting(true);
    
    try {
      // Ensure correct network
      const networkOk = await ensureCorrectNetwork();
      if (!networkOk) {
        return false;
      }

      // Get Privy wallet signer
      const { signer } = await getPrivyWallet();
      
      toast.info('Submitting score to blockchain...');
      
      // Submit score using Privy wallet
      const txHash = await submitGameScore(signer, score);
      
      toast.success(`Score submitted successfully! Transaction: ${txHash.slice(0, 10)}...`);
      
      // Refresh player stats after successful submission
      const address = await signer.getAddress();
      await fetchPlayerStats(address);
      await fetchGlobalStats();
      
      return true;
    } catch (error: any) {
      console.error('Error submitting score:', error);
      
      // Handle specific error cases
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction was rejected by user');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction');
      } else if (error.message?.includes('User not authenticated')) {
        toast.error('Please connect your wallet first');
      } else {
        toast.error('Failed to submit score to blockchain');
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, ensureCorrectNetwork, getPrivyWallet]);

  /**
   * Fetch player statistics
   */
  const fetchPlayerStats = useCallback(async (address: string): Promise<void> => {
    try {
      setIsLoading(true);
      const stats = await getPlayerStats(address);
      setPlayerStats(stats);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      toast.error('Failed to fetch player statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch global game statistics
   */
  const fetchGlobalStats = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const stats = await getGlobalStats();
      setGlobalStats(stats);
    } catch (error) {
      console.error('Error fetching global stats:', error);
      toast.error('Failed to fetch global statistics');
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
      const topPlayers = await getTopPlayers(limit);
      setLeaderboard(topPlayers);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to fetch leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    isSubmitting,
    isLoading,
    playerStats,
    globalStats,
    leaderboard,
    
    // Actions
    submitScore,
    fetchPlayerStats,
    fetchGlobalStats,
    fetchLeaderboard,
    ensureCorrectNetwork
  };
}

export default useGameScoreContract;