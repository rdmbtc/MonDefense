import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import {
  submitGameScore,
  getPlayerStats,
  getGlobalStats,
  getTopPlayers,
  isConnectedToMonadTestnet,
  switchToMonadTestnet,
  PlayerStats,
  GlobalStats,
  LeaderboardEntry
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

  /**
   * Ensure the user is connected to the correct network (Monad testnet)
   */
  const ensureCorrectNetwork = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        toast.error('Please install MetaMask or another Web3 wallet');
        return false;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const isCorrectNetwork = await isConnectedToMonadTestnet(provider);
      
      if (!isCorrectNetwork) {
        toast.info('Switching to Monad testnet...');
        await switchToMonadTestnet();
        
        // Verify the switch was successful
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const isNowCorrect = await isConnectedToMonadTestnet(newProvider);
        
        if (!isNowCorrect) {
          toast.error('Failed to switch to Monad testnet');
          return false;
        }
        
        toast.success('Successfully switched to Monad testnet');
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring correct network:', error);
      toast.error('Failed to connect to Monad testnet');
      return false;
    }
  }, []);

  /**
   * Submit a game score to the blockchain
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

      // Get signer
      if (typeof window === 'undefined' || !window.ethereum) {
        toast.error('Web3 wallet not available');
        return false;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      toast.info('Submitting score to blockchain...');
      
      // Submit score
      const txHash = await submitGameScore(signer, score, transactionCount);
      
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
      } else {
        toast.error('Failed to submit score to blockchain');
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, ensureCorrectNetwork]);

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