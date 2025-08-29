"use client";

import { useMutation } from "@tanstack/react-query";
import { api, apiEndpoints } from "../lib/api";
import { GAME_CONFIG } from "../lib/game-config";

interface OnchainScoreSubmissionRequest {
  walletAddress: string;
  score: number;
  transactionCount: number;
}

interface OnchainScoreSubmissionResponse {
  success: boolean;
  message?: string;
  transactionHash?: string;
  blockNumber?: string;
  gasUsed?: string;
  gameId?: string;
  leaderboardUrl?: string;
  error?: string;
  details?: string;
}

export function useOnchainScoreSubmission() {
  return useMutation({
    mutationFn: async (data: OnchainScoreSubmissionRequest): Promise<OnchainScoreSubmissionResponse> => {
      const response = await api.post<OnchainScoreSubmissionResponse>(
        apiEndpoints.submitScoreOnchain,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        console.log('Score submitted on-chain successfully:', {
          transactionHash: data.transactionHash,
          blockNumber: data.blockNumber,
          gasUsed: data.gasUsed,
          gameId: data.gameId
        });
      } else {
        console.error('On-chain score submission failed:', data.error);
      }
    },
    onError: (error) => {
      console.error('Error submitting score on-chain:', error);
    },
  });
}

// Utility hook to submit score with automatic retry logic
export function useOnchainScoreSubmissionWithRetry() {
  const mutation = useOnchainScoreSubmission();

  const submitWithRetry = async (
    walletAddress: string,
    score: number,
    transactionCount: number,
    maxRetries: number = 3
  ) => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await mutation.mutateAsync({
          walletAddress,
          score,
          transactionCount
        });
        
        if (result.success) {
          return result;
        } else {
          lastError = new Error(result.error || 'Unknown error');
          console.warn(`On-chain submission attempt ${attempt} failed:`, result.error);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`On-chain submission attempt ${attempt} failed:`, error);
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  };

  return {
    ...mutation,
    submitWithRetry,
    isSubmitting: mutation.isPending
  };
}