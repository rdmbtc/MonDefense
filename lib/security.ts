import { SubmitScoreRequest } from '../types';

/**
 * Enhanced Security Validation Module
 * Provides comprehensive validation for game-related operations
 */

export class SecurityValidator {
  // Rate limiting configuration
  private static readonly RATE_LIMITS = {
    scoreSubmissions: {
      maxPerMinute: 5,
      maxPerHour: 100,
      maxPerDay: 1000
    },
    sessionCreations: {
      maxPerHour: 10,
      maxPerDay: 100
    }
  };

  // In-memory storage for replay attack prevention (in production, use Redis or similar)
  private static recentSubmissions: Array<{
    player: string;
    sessionId: string;
    timestamp: number;
    score: number;
  }> = [];

  // Rate limiting storage
  private static rateLimitStore: Map<string, number[]> = new Map();

  /**
   * Clean up old entries from memory (call periodically)
   */
  private static cleanupOldData(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Clean recent submissions (keep last 24 hours)
    this.recentSubmissions = this.recentSubmissions.filter(
      submission => now - submission.timestamp < oneDayAgo
    );

    // Clean rate limit store
    for (const [key, timestamps] of this.rateLimitStore.entries()) {
      const filteredTimestamps = timestamps.filter(timestamp => timestamp > oneHourAgo);
      if (filteredTimestamps.length === 0) {
        this.rateLimitStore.delete(key);
      } else {
        this.rateLimitStore.set(key, filteredTimestamps);
      }
    }
  }

  /**
   * Initialize periodic cleanup
   */
  private static initializeCleanup(): void {
    // Clean up every 5 minutes
    setInterval(() => {
      this.cleanupOldData();
    }, 5 * 60 * 1000);
  }

  static {
    // Initialize cleanup on class load
    this.initializeCleanup();
  }

  // Score validation constants
  private static readonly SCORE_CONSTRAINTS = {
    maxScorePerSecond: 100, // Maximum legitimate score gain per second
    minGameDuration: 30000, // Minimum game duration in milliseconds (30 seconds)
    maxScoreMultiplier: 3, // Allowable buffer for legitimate play
    suspiciousScoreThreshold: 0.95 // Threshold for flagging suspicious scores
  };

  /**
   * Validate score submission request data
   */
  static validateScoreRequest(data: SubmitScoreRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!data.player || !data.player.startsWith('0x')) {
      errors.push('Invalid or missing player wallet address');
    }

    if (!data.sessionId || typeof data.sessionId !== 'string') {
      errors.push('Invalid or missing session ID');
    }

    if (typeof data.scoreAmount !== 'number' || data.scoreAmount < 0) {
      errors.push('Invalid score amount');
    }

    if (typeof data.transactionAmount !== 'number' || data.transactionAmount < 0) {
      errors.push('Invalid transaction amount');
    }

    // Validate timestamp if provided
    if (data.timestamp) {
      const now = Date.now();
      const timestampDiff = Math.abs(now - data.timestamp);
      
      if (timestampDiff > 300000) { // 5 minutes
        errors.push('Timestamp is too old or too far in the future');
      }
    }

    // Validate session duration if provided
    if (data.sessionDuration) {
      if (data.sessionDuration < this.SCORE_CONSTRAINTS.minGameDuration) {
        errors.push('Game session duration is too short');
      }

      // Calculate maximum allowed score based on session duration
      const maxAllowedScore = Math.floor(data.sessionDuration / 1000) * this.SCORE_CONSTRAINTS.maxScorePerSecond * this.SCORE_CONSTRAINTS.maxScoreMultiplier;
      
      if (data.scoreAmount > maxAllowedScore) {
        errors.push(`Score exceeds maximum allowed value of ${maxAllowedScore} for session duration`);
      }
    }

    // Validate game start time if provided
    if (data.gameStartTime) {
      const now = Date.now();
      const gameDuration = now - data.gameStartTime;
      
      if (gameDuration < this.SCORE_CONSTRAINTS.minGameDuration) {
        errors.push('Game duration is too short to achieve this score');
      }

      // Calculate expected maximum score
      const expectedMaxScore = Math.floor(gameDuration / 1000) * this.SCORE_CONSTRAINTS.maxScorePerSecond;
      const scoreRatio = data.scoreAmount / expectedMaxScore;
      
      if (scoreRatio > this.SCORE_CONSTRAINTS.maxScoreMultiplier) {
        errors.push(`Score progression appears suspicious (ratio: ${scoreRatio.toFixed(2)})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for potential replay attacks
   */
  static checkReplayAttack(
    player: string,
    sessionId: string,
    timestamp: number,
    recentSubmissions: Array<{ player: string; sessionId: string; timestamp: number }>
  ): { isReplay: boolean; details?: string } {
    // Check for exact duplicate submissions
    const exactDuplicate = recentSubmissions.find(submission => 
      submission.player === player && 
      submission.sessionId === sessionId && 
      submission.timestamp === timestamp
    );

    if (exactDuplicate) {
      return {
        isReplay: true,
        details: 'Exact duplicate submission detected'
      };
    }

    // Check for submissions with very similar timestamps (potential replay within short window)
    const timeWindow = 5000; // 5 seconds
    const similarTimestamp = recentSubmissions.find(submission => 
      submission.player === player && 
      submission.sessionId === sessionId && 
      Math.abs(submission.timestamp - timestamp) < timeWindow
    );

    if (similarTimestamp) {
      return {
        isReplay: true,
        details: `Similar timestamp submission detected within ${timeWindow}ms window`
      };
    }

    return { isReplay: false };
  }

  /**
   * Validate session integrity
   */
  static validateSession(
    sessionId: string,
    sessionStartTime: number,
    walletAddress: string
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check session age
    const sessionAge = Date.now() - sessionStartTime;
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

    if (sessionAge > maxSessionAge) {
      errors.push('Session has expired');
    }

    // Basic session ID format validation
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 10) {
      errors.push('Invalid session ID format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Rate limiting check
   */
  static checkRateLimit(
    player: string,
    action: 'scoreSubmission' | 'sessionCreation',
    timestamps: number[]
  ): { allowed: boolean; retryAfter?: number; reason?: string } {
    const now = Date.now();
    const windowMs = action === 'scoreSubmission' ? 60000 : 3600000; // 1 min for score, 1 hour for session
    const maxRequests = action === 'scoreSubmission' 
      ? this.RATE_LIMITS.scoreSubmissions.maxPerMinute
      : this.RATE_LIMITS.sessionCreations.maxPerHour;

    // Count requests within the time window
    const recentRequests = timestamps.filter(timestamp => now - timestamp < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
      
      return {
        allowed: false,
        retryAfter,
        reason: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      };
    }

    return { allowed: true };
  }

  /**
   * Enhanced score validation with behavioral analysis
   */
  static analyzeScoreBehavior(
    scoreHistory: Array<{ score: number; timestamp: number; sessionId: string }>,
    currentScore: number,
    currentTime: number
  ): { suspicious: boolean; factors: string[] } {
    const factors: string[] = [];
    let suspicious = false;

    if (scoreHistory.length < 2) {
      return { suspicious: false, factors: [] };
    }

    // Analyze score progression patterns
    const recentScores = scoreHistory.slice(-10); // Last 10 score updates
    const scoreGaps = recentScores.slice(1).map((score, index) => 
      score.score - recentScores[index].score
    );

    // Check for unrealistic score jumps
    const maxGap = Math.max(...scoreGaps);
    if (maxGap > this.SCORE_CONSTRAINTS.maxScorePerSecond * 10) {
      factors.push('Unrealistically large score jump detected');
      suspicious = true;
    }

    // Check for consistent high-frequency scoring
    const timeGaps = recentScores.slice(1).map((score, index) => 
      score.timestamp - recentScores[index].timestamp
    );
    const avgTimeGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
    
    if (avgTimeGap < 100 && currentScore > 1000) { // Less than 100ms between scores
      factors.push('Extremely high scoring frequency detected');
      suspicious = true;
    }

    // Check for exponential score growth
    const growthRates = scoreGaps.slice(1).map((gap, index) => 
      gap / scoreGaps[index]
    );
    const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    
    if (avgGrowthRate > 2 && scoreGaps.length > 3) { // Average growth rate > 2x
      factors.push('Exponential score growth pattern detected');
      suspicious = true;
    }

    return { suspicious, factors };
  }

  /**
   * Generate security audit log entry
   */
  static generateAuditLog(
    action: string,
    player: string,
    sessionId: string,
    details: Record<string, any>,
    severity: 'info' | 'warn' | 'error' = 'info'
  ): {
    timestamp: number;
    action: string;
    player: string;
    sessionId: string;
    details: Record<string, any>;
    severity: string;
    ip?: string;
    userAgent?: string;
  } {
    return {
      timestamp: Date.now(),
      action,
      player,
      sessionId,
      details,
      severity,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown'
    };
  }

  /**
   * Validate request origin and headers
   */
  static validateRequestHeaders(headers: Record<string, string>): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for required security headers
    const requiredHeaders = [
      'User-Agent',
      'Accept',
      'Accept-Language'
    ];

    for (const header of requiredHeaders) {
      if (!headers[header]) {
        issues.push(`Missing required header: ${header}`);
      }
    }

    // Validate User-Agent format
    const userAgent = headers['User-Agent'];
    if (userAgent && (userAgent.length < 10 || userAgent === 'unknown')) {
      issues.push('Suspicious or malformed User-Agent');
    }

    // Check for suspicious headers
    const suspiciousHeaders = [
      'X-Forwarded-For',
      'X-Real-IP',
      'CF-Connecting-IP'
    ];

    for (const header of suspiciousHeaders) {
      if (headers[header]) {
        // Log but don't block - these are common in proxy environments
        console.log(`Proxy header detected: ${header}=${headers[header]}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Enhanced anti-replay protection with score tracking
   */
  static checkAntiReplayProtection(
    player: string,
    sessionId: string,
    timestamp: number,
    score: number
  ): { valid: boolean; reason?: string } {
    // Check for exact duplicate submissions
    const duplicate = this.recentSubmissions.find(submission => 
      submission.player === player && 
      submission.sessionId === sessionId && 
      submission.timestamp === timestamp &&
      submission.score === score
    );

    if (duplicate) {
      return {
        valid: false,
        reason: 'Duplicate score submission detected'
      };
    }

    // Check for submissions with identical data but different timestamps (potential replay)
    const identicalData = this.recentSubmissions.find(submission => 
      submission.player === player && 
      submission.sessionId === sessionId && 
      submission.score === score &&
      Math.abs(submission.timestamp - timestamp) < 10000 // 10 seconds window
    );

    if (identicalData) {
      return {
        valid: false,
        reason: 'Potential replay attack detected: identical score submission within time window'
      };
    }

    // Check for rapid successive submissions with same score
    const recentSameScore = this.recentSubmissions.filter(submission => 
      submission.player === player && 
      submission.sessionId === sessionId && 
      submission.score === score &&
      timestamp - submission.timestamp < 30000 // 30 seconds
    );

    if (recentSameScore.length >= 3) {
      return {
        valid: false,
        reason: 'Excessive same-score submissions detected'
      };
    }

    return { valid: true };
  }

  /**
   * Record a score submission for anti-replay protection
   */
  static recordSubmission(
    player: string,
    sessionId: string,
    timestamp: number,
    score: number
  ): void {
    this.recentSubmissions.push({
      player,
      sessionId,
      timestamp,
      score
    });

    // Keep only recent submissions (last 24 hours will be cleaned up by cleanupOldData)
    if (this.recentSubmissions.length > 10000) {
      this.recentSubmissions = this.recentSubmissions.slice(-5000);
    }
  }

  /**
   * Get rate limit timestamps for a specific player and action
   */
  static getRateLimitTimestamps(player: string, action: 'scoreSubmission' | 'sessionCreation'): number[] {
    const key = `${player}:${action}`;
    return this.rateLimitStore.get(key) || [];
  }

  /**
   * Add a timestamp to rate limit tracking
   */
  static addRateLimitTimestamp(player: string, action: 'scoreSubmission' | 'sessionCreation'): void {
    const key = `${player}:${action}`;
    const timestamps = this.getRateLimitTimestamps(player, action);
    timestamps.push(Date.now());
    this.rateLimitStore.set(key, timestamps);
  }

  /**
   * Comprehensive security validation for score submission
   */
  static validateScoreSubmission(
    data: SubmitScoreRequest,
    player: string,
    sessionId: string
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    const basicValidation = this.validateScoreRequest(data);
    if (!basicValidation.valid) {
      errors.push(...basicValidation.errors);
    }

    // Session validation
    const sessionValidation = this.validateSession(sessionId, data.gameStartTime || Date.now(), player);
    if (!sessionValidation.valid) {
      errors.push(...sessionValidation.errors);
    }

    // Anti-replay protection
    const antiReplayValidation = this.checkAntiReplayProtection(
      player,
      sessionId,
      data.timestamp || Date.now(),
      data.scoreAmount
    );
    if (!antiReplayValidation.valid) {
      errors.push(antiReplayValidation.reason!);
    }

    // Rate limiting
    const rateLimitTimestamps = this.getRateLimitTimestamps(player, 'scoreSubmission');
    const rateLimitCheck = this.checkRateLimit(player, 'scoreSubmission', rateLimitTimestamps);
    if (!rateLimitCheck.allowed) {
      errors.push(rateLimitCheck.reason!);
    }

    // Behavioral analysis
    const behavioralAnalysis = this.analyzeScoreBehavior(
      [], // In a real implementation, this would come from a database
      data.scoreAmount,
      data.timestamp || Date.now()
    );
    if (behavioralAnalysis.suspicious) {
      warnings.push('Suspicious scoring behavior detected:', ...behavioralAnalysis.factors);
    }

    // Record submission for future anti-replay checks
    if (errors.length === 0) {
      this.recordSubmission(
        player,
        sessionId,
        data.timestamp || Date.now(),
        data.scoreAmount
      );
      this.addRateLimitTimestamp(player, 'scoreSubmission');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
