// Score submission API utilities

export interface ScoreSubmissionResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  playerAddress?: string;
  scoreAmount?: number;
  transactionAmount?: number;
}

export interface QueuedTransaction {
  playerAddress: string;
  scoreAmount: number;
  transactionAmount: number;
  timestamp: number;
}

export interface PlayerDataResponse {
  totalScore: string;
  totalTransactions: string;
}

export interface PlayerDataPerGameResponse {
  score: string;
  transactions: string;
}

/**
 * Get cached session token (to be used with useAuth hook)
 */
export function getCachedSessionToken(playerAddress: string): string | null {
  const cachedToken = localStorage.getItem(`session_${playerAddress}`);
  const cachedExpiry = localStorage.getItem(`session_${playerAddress}_expiry`);
  
  if (!cachedToken || !cachedExpiry) {
    return null;
  }
  
  if (Date.now() >= parseInt(cachedExpiry)) {
    // Token expired, clean up
    localStorage.removeItem(`session_${playerAddress}`);
    localStorage.removeItem(`session_${playerAddress}_expiry`);
    return null;
  }
  
  return cachedToken;
}

/**
 * Submit player score - API removed as requested
 */
export async function submitPlayerScore(
  playerAddress: string,
  score: number,
  transactionCount: number,
  sessionToken: string
): Promise<ScoreSubmissionResponse> {
  // API has been removed
  return {
    success: false,
    error: 'API has been removed'
  };
}

/**
 * Get player total data from the contract
 */
export async function getPlayerTotalData(playerAddress: string): Promise<PlayerDataResponse | null> {
  try {
    // This would typically call a read function on the contract
    // For now, return null as this needs to be implemented with the contract reading logic
    return null;
  } catch (error) {
    console.error('Error fetching player total data:', error);
    return null;
  }
}

/**
 * Get player data for a specific game
 */
export async function getPlayerGameData(
  playerAddress: string,
  gameAddress: string
): Promise<PlayerDataPerGameResponse | null> {
  try {
    // This would typically call the playerDataPerGame function on the contract
    // For now, return null as this needs to be implemented with the contract reading logic
    return null;
  } catch (error) {
    console.error('Error fetching player game data:', error);
    return null;
  }
}

/**
 * Score submission manager with batching and queuing
 */
export class ScoreSubmissionManager {
  private queue: Array<{
    playerAddress: string;
    score: number;
    transactionCount: number;
    sessionToken: string;
    resolve: (value: ScoreSubmissionResponse) => void;
    reject: (reason: any) => void;
  }> = [];
  
  private isProcessing = false;
  private batchTimeout: NodeJS.Timeout | null = null;
  
  /**
   * Add score submission to queue
   */
  async submitScore(
    playerAddress: string,
    score: number,
    transactionCount: number,
    sessionToken: string
  ): Promise<ScoreSubmissionResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        playerAddress,
        score,
        transactionCount,
        sessionToken,
        resolve,
        reject
      });
      
      this.scheduleBatch();
    });
  }
  
  /**
   * Schedule batch processing with delay
   */
  private scheduleBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, 5000); // 5 second delay
  }
  
  /**
   * Process queued submissions
   */
  private async processBatch() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    const batch = [...this.queue];
    this.queue = [];
    
    // Process each submission
    for (const item of batch) {
      try {
        const result = await submitPlayerScore(
          item.playerAddress,
          item.score,
          item.transactionCount,
          item.sessionToken
        );
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }
    
    this.isProcessing = false;
    
    // Process any new items that were added during processing
    if (this.queue.length > 0) {
      this.scheduleBatch();
    }
  }
}

// Export a singleton instance
export const scoreSubmissionManager = new ScoreSubmissionManager();