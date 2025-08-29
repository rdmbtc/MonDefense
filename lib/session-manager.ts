// Shared session manager to prevent resource issues and ensure consistency
// across all API endpoints

export interface ActiveSession {
  sessionId: string;
  player: string;
  startTime: number;
  lastActivity: number;
}

export interface SessionStats {
  totalScore: number;
  totalTransactions: number;
  submissionCount: number;
  startTime: number;
  endTime?: number;
}

// Singleton session manager
class SessionManager {
  private static instance: SessionManager;
  private activeSessions = new Map<string, ActiveSession>();
  private sessionStats = new Map<string, SessionStats>();
  private readonly MAX_SESSIONS = 1000;
  private readonly SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

  private constructor() {
    // Start cleanup interval
    this.startCleanupInterval();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Create a new session
  public createSession(sessionId: string, player: string): void {
    const now = Date.now();
    
    this.activeSessions.set(sessionId, {
      sessionId,
      player,
      startTime: now,
      lastActivity: now,
    });

    this.sessionStats.set(sessionId, {
      totalScore: 0,
      totalTransactions: 0,
      submissionCount: 0,
      startTime: now,
    });

    // Clean up old sessions if we exceed the limit
    this.cleanupOldSessions();
    
    console.log(`Session created: ${sessionId} for player: ${player}`);
  }

  // Get an active session
  public getActiveSession(sessionId: string): ActiveSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  // Update session activity
  public updateSessionActivity(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      this.activeSessions.set(sessionId, session);
    }
  }

  // Get session statistics
  public getSessionStats(sessionId: string): SessionStats | undefined {
    return this.sessionStats.get(sessionId);
  }

  // Update session statistics
  public updateSessionStats(
    sessionId: string,
    scoreAmount: number,
    transactionAmount: number
  ): SessionStats {
    const currentStats = this.sessionStats.get(sessionId) || {
      totalScore: 0,
      totalTransactions: 0,
      submissionCount: 0,
      startTime: Date.now(),
    };

    currentStats.totalScore += scoreAmount;
    currentStats.totalTransactions += transactionAmount;
    currentStats.submissionCount += 1;
    
    this.sessionStats.set(sessionId, currentStats);
    return currentStats;
  }

  // End a session
  public endSession(sessionId: string): SessionStats | undefined {
    const stats = this.sessionStats.get(sessionId);
    
    if (stats) {
      stats.endTime = Date.now();
      this.sessionStats.set(sessionId, stats);
    }

    // Remove from active sessions
    const removed = this.activeSessions.delete(sessionId);
    
    if (removed) {
      console.log(`Session ended: ${sessionId}`);
    }
    
    return stats;
  }

  // Clean up old sessions to prevent memory leaks
  private cleanupOldSessions(): void {
    const now = Date.now();
    
    // Remove sessions that exceed the maximum count
    if (this.activeSessions.size > this.MAX_SESSIONS) {
      const oldestSessionIds = Array.from(this.activeSessions.keys())
        .slice(0, this.activeSessions.size - this.MAX_SESSIONS);
      
      oldestSessionIds.forEach(id => {
        this.activeSessions.delete(id);
        this.sessionStats.delete(id);
      });
      
      console.log(`Cleaned up ${oldestSessionIds.length} old sessions due to size limit`);
    }

    // Remove expired sessions
    const expiredSessions: string[] = [];
    
    this.activeSessions.forEach((session, sessionId) => {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        expiredSessions.push(sessionId);
      }
    });

    expiredSessions.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
      // Keep stats for ended sessions for a while
      const stats = this.sessionStats.get(sessionId);
      if (stats && !stats.endTime) {
        stats.endTime = now;
        this.sessionStats.set(sessionId, stats);
      }
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  // Start periodic cleanup
  private startCleanupInterval(): void {
    // Run cleanup every 10 minutes
    setInterval(() => {
      this.cleanupOldSessions();
    }, 10 * 60 * 1000);
  }

  // Get session counts for monitoring
  public getSessionCounts(): { active: number; total: number } {
    return {
      active: this.activeSessions.size,
      total: this.sessionStats.size,
    };
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();