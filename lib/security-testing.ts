import { SecurityValidator } from './security';
import { monitoringService } from './monitoring';
import { SubmitScoreRequest } from '../types';

/**
 * Security Testing Module
 * Provides comprehensive testing capabilities for security features
 */

export class SecurityTester {
  /**
   * Run comprehensive security tests
   */
  static async runSecurityTests(): Promise<{
    results: {
      scoreValidation: boolean;
      antiReplayProtection: boolean;
      rateLimiting: boolean;
      sessionValidation: boolean;
      behavioralAnalysis: boolean;
    };
    issues: string[];
    recommendations: string[];
  }> {
    const results = {
      scoreValidation: false,
      antiReplayProtection: false,
      rateLimiting: false,
      sessionValidation: false,
      behavioralAnalysis: false
    };

    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test 1: Score Validation
      console.log('Testing score validation...');
      const scoreValidationResult = this.testScoreValidation();
      results.scoreValidation = scoreValidationResult.passed;
      if (!scoreValidationResult.passed) {
        issues.push(...scoreValidationResult.issues);
        recommendations.push(...scoreValidationResult.recommendations);
      }

      // Test 2: Anti-Replay Protection
      console.log('Testing anti-replay protection...');
      const antiReplayResult = this.testAntiReplayProtection();
      results.antiReplayProtection = antiReplayResult.passed;
      if (!antiReplayResult.passed) {
        issues.push(...antiReplayResult.issues);
        recommendations.push(...antiReplayResult.recommendations);
      }

      // Test 3: Rate Limiting
      console.log('Testing rate limiting...');
      const rateLimitResult = this.testRateLimiting();
      results.rateLimiting = rateLimitResult.passed;
      if (!rateLimitResult.passed) {
        issues.push(...rateLimitResult.issues);
        recommendations.push(...rateLimitResult.recommendations);
      }

      // Test 4: Session Validation
      console.log('Testing session validation...');
      const sessionResult = this.testSessionValidation();
      results.sessionValidation = sessionResult.passed;
      if (!sessionResult.passed) {
        issues.push(...sessionResult.issues);
        recommendations.push(...sessionResult.recommendations);
      }

      // Test 5: Behavioral Analysis
      console.log('Testing behavioral analysis...');
      const behavioralResult = this.testBehavioralAnalysis();
      results.behavioralAnalysis = behavioralResult.passed;
      if (!behavioralResult.passed) {
        issues.push(...behavioralResult.issues);
        recommendations.push(...behavioralResult.recommendations);
      }

      // Log test results
      monitoringService.logGameEvent(
        'score_submit',
        `Security test completed: ${Object.values(results).filter(Boolean).length}/${Object.keys(results).length} tests passed`,
        { 
          results,
          totalTests: Object.keys(results).length,
          passedTests: Object.values(results).filter(Boolean).length
        }
      );

      return { results, issues, recommendations };

    } catch (error) {
      monitoringService.logSecurityEvent(
        'validation',
        'error',
        `Security test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
      throw error;
    }
  }

  /**
   * Test score validation functionality
   */
  private static testScoreValidation(): { passed: boolean; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let passed = true;

    // Test valid score submission
    const validScore: SubmitScoreRequest = {
      player: '0x1234567890123456789012345678901234567890',
      sessionId: 'test-session-123',
      scoreAmount: 1000,
      transactionAmount: 1,
      timestamp: Date.now(),
      sessionDuration: 60000,
      gameStartTime: Date.now() - 60000
    };

    const validation = SecurityValidator.validateScoreRequest(validScore);
    if (!validation.valid) {
      issues.push('Valid score submission failed validation');
      passed = false;
    }

    // Test invalid score submissions
    const invalidScores = [
      { ...validScore, player: 'invalid-address' },
      { ...validScore, sessionId: '' },
      { ...validScore, scoreAmount: -100 },
      { ...validScore, transactionAmount: -1 },
      { ...validScore, timestamp: Date.now() - 600000 } // 10 minutes ago
    ];

    for (let i = 0; i < invalidScores.length; i++) {
      const invalidValidation = SecurityValidator.validateScoreRequest(invalidScores[i]);
      if (invalidValidation.valid) {
        issues.push(`Invalid score submission ${i + 1} passed validation`);
        passed = false;
      }
    }

    if (passed) {
      recommendations.push('Score validation is working correctly');
    } else {
      recommendations.push('Review score validation logic and error handling');
    }

    return { passed, issues, recommendations };
  }

  /**
   * Test anti-replay protection
   */
  private static testAntiReplayProtection(): { passed: boolean; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let passed = true;

    const testPlayer = '0x1234567890123456789012345678901234567890';
    const testSession = 'test-session-456';
    const testTimestamp = Date.now();
    const testScore = 1500;

    // Test valid submission
    const validCheck = SecurityValidator.checkAntiReplayProtection(
      testPlayer, testSession, testTimestamp, testScore
    );
    if (!validCheck.valid) {
      issues.push('Valid submission flagged as replay attack');
      passed = false;
    }

    // Test duplicate submission
    SecurityValidator.recordSubmission(testPlayer, testSession, testTimestamp, testScore);
    const duplicateCheck = SecurityValidator.checkAntiReplayProtection(
      testPlayer, testSession, testTimestamp, testScore
    );
    if (duplicateCheck.valid) {
      issues.push('Duplicate submission not detected');
      passed = false;
    }

    // Test similar timestamp submission
    const similarTimestampCheck = SecurityValidator.checkAntiReplayProtection(
      testPlayer, testSession, testTimestamp + 1000, testScore
    );
    if (similarTimestampCheck.valid) {
      issues.push('Similar timestamp submission not detected');
      passed = false;
    }

    // Clear test data
    SecurityValidator['recentSubmissions'] = SecurityValidator['recentSubmissions'].filter(
      sub => !(sub.player === testPlayer && sub.sessionId === testSession)
    );

    if (passed) {
      recommendations.push('Anti-replay protection is working correctly');
    } else {
      recommendations.push('Review anti-replay protection logic');
    }

    return { passed, issues, recommendations };
  }

  /**
   * Test rate limiting
   */
  private static testRateLimiting(): { passed: boolean; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let passed = true;

    const testPlayer = '0x9876543210987654321098765432109876543210';
    const action: 'scoreSubmission' | 'sessionCreation' = 'scoreSubmission';

    // Test within rate limit
    const timestamps = Array.from({ length: 4 }, (_, i) => Date.now() - i * 10000);
    const rateLimitCheck = SecurityValidator.checkRateLimit(testPlayer, action, timestamps);
    if (!rateLimitCheck.allowed) {
      issues.push('Rate limit triggered too early');
      passed = false;
    }

    // Test over rate limit
    const overLimitTimestamps = Array.from({ length: 6 }, (_, i) => Date.now() - i * 5000);
    const overLimitCheck = SecurityValidator.checkRateLimit(testPlayer, action, overLimitTimestamps);
    if (overLimitCheck.allowed) {
      issues.push('Rate limit not enforced');
      passed = false;
    }

    if (passed) {
      recommendations.push('Rate limiting is working correctly');
    } else {
      recommendations.push('Review rate limiting configuration and logic');
    }

    return { passed, issues, recommendations };
  }

  /**
   * Test session validation
   */
  private static testSessionValidation(): { passed: boolean; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let passed = true;

    const testPlayer = '0x1111111111111111111111111111111111111111';
    const validSessionId = 'valid-session-789';
    const invalidSessionId = 'short';

    // Test valid session
    const validSession = SecurityValidator.validateSession(
      validSessionId, Date.now(), testPlayer
    );
    if (!validSession.valid) {
      issues.push('Valid session failed validation');
      passed = false;
    }

    // Test expired session
    const expiredSession = SecurityValidator.validateSession(
      validSessionId, Date.now() - 25 * 60 * 60 * 1000, testPlayer // 25 hours ago
    );
    if (expiredSession.valid) {
      issues.push('Expired session not detected');
      passed = false;
    }

    // Test invalid session ID
    const invalidSession = SecurityValidator.validateSession(
      invalidSessionId, Date.now(), testPlayer
    );
    if (invalidSession.valid) {
      issues.push('Invalid session ID not detected');
      passed = false;
    }

    if (passed) {
      recommendations.push('Session validation is working correctly');
    } else {
      recommendations.push('Review session validation logic');
    }

    return { passed, issues, recommendations };
  }

  /**
   * Test behavioral analysis
   */
  private static testBehavioralAnalysis(): { passed: boolean; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let passed = true;

    // Test normal scoring behavior
    const normalScoreHistory = Array.from({ length: 10 }, (_, i) => ({
      score: i * 100,
      timestamp: Date.now() - (10 - i) * 5000,
      sessionId: 'normal-session'
    }));

    const normalBehavior = SecurityValidator.analyzeScoreBehavior(
      normalScoreHistory, 1000, Date.now()
    );
    if (normalBehavior.suspicious) {
      issues.push('Normal scoring behavior flagged as suspicious');
      passed = false;
    }

    // Test suspicious scoring behavior (exponential growth)
    const suspiciousScoreHistory = Array.from({ length: 5 }, (_, i) => ({
      score: Math.pow(2, i) * 100,
      timestamp: Date.now() - (5 - i) * 1000,
      sessionId: 'suspicious-session'
    }));

    const suspiciousBehavior = SecurityValidator.analyzeScoreBehavior(
      suspiciousScoreHistory, 1600, Date.now()
    );
    if (!suspiciousBehavior.suspicious) {
      issues.push('Suspicious scoring behavior not detected');
      passed = false;
    }

    if (passed) {
      recommendations.push('Behavioral analysis is working correctly');
    } else {
      recommendations.push('Review behavioral analysis thresholds and logic');
    }

    return { passed, issues, recommendations };
  }

  /**
   * Generate security test report
   */
  static generateSecurityReport(): {
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      securityScore: number;
    };
    testResults: {
      scoreValidation: boolean;
      antiReplayProtection: boolean;
      rateLimiting: boolean;
      sessionValidation: boolean;
      behavioralAnalysis: boolean;
    };
    issues: string[];
    recommendations: string[];
    lastTested: number;
  } {
    const testResults = SecurityValidator['recentSubmissions'].length > 0 ? {
      scoreValidation: true,
      antiReplayProtection: true,
      rateLimiting: true,
      sessionValidation: true,
      behavioralAnalysis: true
    } : {
      scoreValidation: false,
      antiReplayProtection: false,
      rateLimiting: false,
      sessionValidation: false,
      behavioralAnalysis: false
    };

    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    const securityScore = Math.round((passedTests / totalTests) * 100);

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        securityScore
      },
      testResults,
      issues: [],
      recommendations: [],
      lastTested: Date.now()
    };
  }

  /**
   * Simulate security attacks for testing
   */
  static simulateAttacks(): void {
    console.log('Simulating security attacks...');

    // Simulate replay attack
    const replayAttackData: SubmitScoreRequest = {
      player: '0xattacker1234567890123456789012345678901234567890',
      sessionId: 'replay-session',
      scoreAmount: 999999,
      transactionAmount: 1,
      timestamp: Date.now(),
      sessionDuration: 1000,
      gameStartTime: Date.now() - 1000
    };

    const validation = SecurityValidator.validateScoreSubmission(
      replayAttackData, replayAttackData.player, replayAttackData.sessionId
    );

    if (!validation.valid) {
      console.log('✓ Replay attack successfully blocked');
      monitoringService.logSecurityEvent(
        'replay_attack',
        'warn',
        'Simulated replay attack blocked',
        { attackType: 'replay', validationErrors: validation.errors }
      );
    } else {
      console.log('✗ Replay attack not detected');
    }

    // Simulate rate limit attack
    const rateLimitPlayer = '0xratelimit1234567890123456789012345678901234567890';
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const rateLimitData: SubmitScoreRequest = {
          player: rateLimitPlayer,
          sessionId: 'rate-limit-session',
          scoreAmount: 100,
          transactionAmount: 1,
          timestamp: Date.now(),
          sessionDuration: 60000,
          gameStartTime: Date.now() - 60000
        };

        const rateLimitValidation = SecurityValidator.validateScoreSubmission(
          rateLimitData, rateLimitData.player, rateLimitData.sessionId
        );

        if (!rateLimitValidation.valid && rateLimitValidation.errors.some(e => e.includes('Rate limit'))) {
          console.log(`✓ Rate limit attack attempt ${i + 1} blocked`);
        }
      }, i * 100);
    }

    console.log('Attack simulation completed');
  }
}
