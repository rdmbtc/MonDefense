import { SecurityValidator } from './security';

/**
 * Enhanced Monitoring and Logging Module
 * Provides comprehensive monitoring for game operations and security events
 */

export class MonitoringService {
  private static instance: MonitoringService;
  private eventLog: Array<{
    timestamp: number;
    type: 'security' | 'api' | 'game' | 'error';
    level: 'info' | 'warn' | 'error' | 'critical';
    category: string;
    message: string;
    details?: Record<string, any>;
    playerId?: string;
    sessionId?: string;
  }> = [];

  private metrics: {
    apiCalls: {
      total: number;
      successful: number;
      failed: number;
      byEndpoint: Record<string, { total: number; success: number; fail: number }>;
    };
    securityEvents: {
      total: number;
      blocked: number;
      suspicious: number;
      byType: Record<string, number>;
    };
    gameEvents: {
      sessionsStarted: number;
      sessionsEnded: number;
      scoresSubmitted: number;
      averageSessionDuration: number;
    };
  };

  private constructor() {
    this.metrics = {
      apiCalls: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {}
      },
      securityEvents: {
        total: 0,
        blocked: 0,
        suspicious: 0,
        byType: {}
      },
      gameEvents: {
        sessionsStarted: 0,
        sessionsEnded: 0,
        scoresSubmitted: 0,
        averageSessionDuration: 0
      }
    };
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Log API call metrics
   */
  logApiCall(
    endpoint: string,
    method: string,
    success: boolean,
    duration: number,
    playerId?: string,
    sessionId?: string
  ): void {
    const endpointKey = `${method.toUpperCase()} ${endpoint}`;
    
    this.metrics.apiCalls.total++;
    this.metrics.apiCalls.byEndpoint[endpointKey] = {
      total: (this.metrics.apiCalls.byEndpoint[endpointKey]?.total || 0) + 1,
      success: (this.metrics.apiCalls.byEndpoint[endpointKey]?.success || 0) + (success ? 1 : 0),
      fail: (this.metrics.apiCalls.byEndpoint[endpointKey]?.fail || 0) + (success ? 0 : 1)
    };

    if (success) {
      this.metrics.apiCalls.successful++;
    } else {
      this.metrics.apiCalls.failed++;
    }

    this.log('api', success ? 'info' : 'error', 'api_call', 
      `${method} ${endpoint} - ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`,
      { endpoint, method, success, duration, playerId, sessionId }
    );
  }

  /**
   * Log security events
   */
  logSecurityEvent(
    type: 'validation' | 'rate_limit' | 'replay_attack' | 'suspicious_behavior' | 'breach_attempt',
    level: 'warn' | 'error' | 'critical',
    message: string,
    details: Record<string, any>,
    playerId?: string,
    sessionId?: string
  ): void {
    this.metrics.securityEvents.total++;
    this.metrics.securityEvents.byType[type] = (this.metrics.securityEvents.byType[type] || 0) + 1;

    if (level === 'error' || level === 'critical') {
      this.metrics.securityEvents.blocked++;
    } else if (level === 'warn') {
      this.metrics.securityEvents.suspicious++;
    }

    this.log('security', level, type, message, { ...details, playerId, sessionId });
  }

  /**
   * Log game events
   */
  logGameEvent(
    type: 'session_start' | 'session_end' | 'score_submit' | 'achievement' | 'error',
    message: string,
    details: Record<string, any>,
    playerId?: string,
    sessionId?: string
  ): void {
    switch (type) {
      case 'session_start':
        this.metrics.gameEvents.sessionsStarted++;
        break;
      case 'session_end':
        this.metrics.gameEvents.sessionsEnded++;
        if (details.duration) {
          this.metrics.gameEvents.averageSessionDuration = 
            (this.metrics.gameEvents.averageSessionDuration * (this.metrics.gameEvents.sessionsEnded - 1) + details.duration) / 
            this.metrics.gameEvents.sessionsEnded;
        }
        break;
      case 'score_submit':
        this.metrics.gameEvents.scoresSubmitted++;
        break;
    }

    this.log('game', type === 'error' ? 'error' : 'info', type, message, { ...details, playerId, sessionId });
  }

  /**
   * Internal logging method
   */
  private log(
    type: 'security' | 'api' | 'game' | 'error',
    level: 'info' | 'warn' | 'error' | 'critical',
    category: string,
    message: string,
    details?: Record<string, any>
  ): void {
    const logEntry = {
      timestamp: Date.now(),
      type,
      level,
      category,
      message,
      details,
      playerId: details?.playerId,
      sessionId: details?.sessionId
    };

    this.eventLog.push(logEntry);

    // Keep only last 1000 entries in memory
    if (this.eventLog.length > 1000) {
      this.eventLog = this.eventLog.slice(-1000);
    }

    // Console output for development
    if (process.env.NODE_ENV !== 'production') {
      const logMethod = level === 'error' || level === 'critical' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[logMethod](`[${type.toUpperCase()}] ${category}: ${message}`, details);
    }

    // In production, send to external monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(logEntry);
    }
  }

  /**
   * Send logs to external monitoring service
   */
  private async sendToMonitoringService(logEntry: any): Promise<void> {
    try {
      // In a real implementation, this would send to services like:
      // - Sentry (error tracking)
      // - Datadog (metrics and logs)
      // - ELK Stack (log aggregation)
      // - Custom logging service
      
      const monitoringEndpoint = process.env.MONITORING_ENDPOINT;
      if (monitoringEndpoint) {
        await fetch(monitoringEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`
          },
          body: JSON.stringify({
            ...logEntry,
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version
          })
        });
      }
    } catch (error) {
      console.error('Failed to send log to monitoring service:', error);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      eventLogCount: this.eventLog.length,
      uptime: Date.now() - (this.eventLog[0]?.timestamp || Date.now())
    };
  }

  /**
   * Get recent security events
   */
  getSecurityEvents(limit: number = 50) {
    return this.eventLog
      .filter(event => event.type === 'security')
      .slice(-limit)
      .reverse();
  }

  /**
   * Get API performance metrics
   */
  getApiMetrics() {
    return {
      ...this.metrics.apiCalls,
      successRate: this.metrics.apiCalls.total > 0 
        ? (this.metrics.apiCalls.successful / this.metrics.apiCalls.total) * 100 
        : 0,
      averageDuration: this.calculateAverageDuration()
    };
  }

  /**
   * Calculate average API call duration
   */
  private calculateAverageDuration(): number {
    // This would track actual durations in a real implementation
    // For now, return a placeholder
    return 150; // ms
  }

  /**
   * Generate security report
   */
  generateSecurityReport(): {
    summary: {
      totalEvents: number;
      blockedAttempts: number;
      suspiciousActivities: number;
      averageResponseTime: number;
    };
    topThreats: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    recentAlerts: Array<{
      timestamp: number;
      type: string;
      severity: string;
      description: string;
    }>;
  } {
    const securityEvents = this.eventLog.filter(event => event.type === 'security');
    const totalEvents = securityEvents.length;
    const blockedAttempts = securityEvents.filter(event => event.level === 'error' || event.level === 'critical').length;
    const suspiciousActivities = securityEvents.filter(event => event.level === 'warn').length;

    // Calculate threat distribution
    const threatCounts: Record<string, number> = {};
    securityEvents.forEach(event => {
      threatCounts[event.category] = (threatCounts[event.category] || 0) + 1;
    });

    const topThreats = Object.entries(threatCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent alerts (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentAlerts = securityEvents
      .filter(event => event.timestamp > oneDayAgo && (event.level === 'error' || event.level === 'critical'))
      .slice(-10)
      .map(event => ({
        timestamp: event.timestamp,
        type: event.category,
        severity: event.level,
        description: event.message
      }));

    return {
      summary: {
        totalEvents,
        blockedAttempts,
        suspiciousActivities,
        averageResponseTime: this.calculateAverageDuration()
      },
      topThreats,
      recentAlerts
    };
  }

  /**
   * Export logs for analysis
   */
  exportLogs(filters?: {
    type?: 'security' | 'api' | 'game' | 'error';
    level?: 'info' | 'warn' | 'error' | 'critical';
    category?: string;
    playerId?: string;
    sessionId?: string;
    startDate?: number;
    endDate?: number;
  }): string {
    let filteredLogs = [...this.eventLog];

    if (filters) {
      if (filters.type) {
        filteredLogs = filteredLogs.filter(log => log.type === filters.type);
      }
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }
      if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category);
      }
      if (filters.playerId) {
        filteredLogs = filteredLogs.filter(log => log.playerId === filters.playerId);
      }
      if (filters.sessionId) {
        filteredLogs = filteredLogs.filter(log => log.sessionId === filters.sessionId);
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    return JSON.stringify(filteredLogs, null, 2);
  }

  /**
   * Clear old logs (for memory management)
   */
  clearOldLogs(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - olderThanMs;
    this.eventLog = this.eventLog.filter(log => log.timestamp > cutoffTime);
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();
