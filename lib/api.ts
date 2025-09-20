"use client";

import axios, { InternalAxiosRequestConfig } from "axios";
import { addSignatureToHeaders } from "../utils/signature";
import { SecurityValidator } from "./security";
import { monitoringService } from "./monitoring";

// Extended Axios config type for metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime?: number;
    playerId?: string;
    sessionId?: string;
  };
}

// CSRF Token Management
class CSRFManager {
  private token: string | null = null;
  private expires: Date | null = null;
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async fetchToken(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.csrfToken;
      this.expires = new Date(data.expires);
      
      return this.token!;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      throw error;
    }
  }

  async getToken(): Promise<string> {
    if (this.token && this.expires && new Date() < this.expires) {
      return this.token;
    }
    return await this.fetchToken();
  }

  clearToken(): void {
    this.token = null;
    this.expires = null;
  }
}

// Create CSRF manager instance
const baseURL = process.env.NODE_ENV === "production" 
  ? process.env.NEXT_PUBLIC_API_URL || "https://inland-grete-mondefense-9eee18bb.koyeb.app/"
  : process.env.NEXT_PUBLIC_DEV_API_URL || "http://localhost:3001";

const csrfManager = new CSRFManager(baseURL);

// Create axios instance with base configuration
export const api = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true, // Include cookies for session management
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
  },
});

// Enhanced request interceptor with security validation
api.interceptors.request.use(
  async (config: ExtendedAxiosRequestConfig) => {
    const startTime = Date.now();
    
    // Add CSRF token for state-changing operations
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      try {
        const token = await csrfManager.getToken();
        config.headers['X-CSRF-Token'] = token;
      } catch (error) {
        console.error('Failed to get CSRF token:', error);
        // Continue without token - let the server handle the error
      }
    }
    
    // Add request signature for score submission endpoints
    if (config.url?.includes('/submit-score') && config.data) {
      try {
        const signedHeaders = addSignatureToHeaders(config.data, config.headers as Record<string, string>);
        config.headers = signedHeaders as any;
      } catch (error) {
        console.error('Failed to generate request signature:', error);
        // Continue without signature - server will handle as optional
      }
    }

    // Enhanced security validation for specific endpoints
    if (config.url?.includes('/submit-score') && config.data) {
      const validation = SecurityValidator.validateScoreRequest(config.data);
      if (!validation.valid) {
        monitoringService.logSecurityEvent(
          'validation',
          'error',
          `Score validation failed: ${validation.errors.join(', ')}`,
          { 
            errors: validation.errors,
            requestData: config.data,
            endpoint: config.url
          },
          config.data.player,
          config.data.sessionId
        );
        throw new Error(`Security validation failed: ${validation.errors.join(', ')}`);
      }

      // Validate request headers
      const headerValidation = SecurityValidator.validateRequestHeaders(config.headers);
      if (!headerValidation.valid) {
        monitoringService.logSecurityEvent(
          'validation',
          'warn',
          `Header validation issues: ${headerValidation.issues.join(', ')}`,
          { 
            issues: headerValidation.issues,
            headers: config.headers
          },
          config.data.player,
          config.data.sessionId
        );
      }
    }
    
    // Add security headers for frontend-backend integration
    config.headers['X-Security-Version'] = '1.0.0';
    config.headers['X-Client-Timestamp'] = Date.now().toString();
    config.headers['X-Request-ID'] = generateRequestId();
    
    // Add security metadata for score submissions
    if (config.url?.includes('/submit-score') && config.data) {
      const securityMetadata = {
        player: config.data.player,
        sessionId: config.data.sessionId,
        previousScore: config.data.previousScore || 0,
        sessionStartTime: config.data.gameStartTime || Date.now(),
        clientTimestamp: Date.now(),
        submissionCount: config.data.submissionCount || 1,
        averageScorePerSecond: config.data.averageScorePerSecond || 0,
        lastSubmissionTime: config.data.lastSubmissionTime || Date.now()
      };
      
      config.data.securityMetadata = securityMetadata;
    }
    
    // Add metadata for tracking
    config.metadata = {
      startTime,
      playerId: config.data?.player,
      sessionId: config.data?.sessionId
    };
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with monitoring
api.interceptors.response.use(
  (response) => {
    const config = response.config as ExtendedAxiosRequestConfig;
    const duration = Date.now() - (config.metadata?.startTime || Date.now());
    
    // Log successful API call
    monitoringService.logApiCall(
      config.url || 'unknown',
      config.method || 'GET',
      true,
      duration,
      config.metadata?.playerId,
      config.metadata?.sessionId
    );
    
    return response;
  },
  async (error: any) => {
    const config = error.config as ExtendedAxiosRequestConfig;
    const duration = Date.now() - (config.metadata?.startTime || Date.now());
    
    // Log failed API call
    monitoringService.logApiCall(
      config.url || 'unknown',
      config.method || 'GET',
      false,
      duration,
      config.metadata?.playerId,
      config.metadata?.sessionId
    );

    // Handle CSRF token errors
    if (error.response?.status === 403) {
      const errorData = error.response?.data;
      if (errorData?.code === 'CSRF_INVALID' || errorData?.code === 'CSRF_MISSING') {
        console.warn('CSRF token invalid, refreshing and retrying...');
        csrfManager.clearToken();
        
        // Retry the request with a new token
        try {
          const token = await csrfManager.getToken();
          error.config.headers['X-CSRF-Token'] = token;
          return api.request(error.config);
        } catch (retryError) {
          console.error('Failed to retry request with new CSRF token:', retryError);
          return Promise.reject(error);
        }
      }
    }
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      monitoringService.logSecurityEvent(
        'rate_limit',
        'warn',
        `Rate limit exceeded. Retry after: ${retryAfter || 'unknown'}`,
        { 
          retryAfter,
          endpoint: error.config.url,
          method: error.config.method
        },
        error.config.metadata?.playerId,
        error.config.metadata?.sessionId
      );
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      monitoringService.logSecurityEvent(
        'validation',
        'warn',
        'Unauthorized request attempt',
        { 
          endpoint: error.config.url,
          method: error.config.method
        },
        error.config.metadata?.playerId,
        error.config.metadata?.sessionId
      );
    }
    
    // Handle validation errors
    if (error.response?.status === 400) {
      monitoringService.logSecurityEvent(
        'validation',
        'error',
        `Validation error: ${error.response.data?.error || 'Unknown error'}`,
        { 
          endpoint: error.config.url,
          method: error.config.method,
          errorDetails: error.response.data
        },
        error.config.metadata?.playerId,
        error.config.metadata?.sessionId
      );
    }
    
    return Promise.reject(error);
  }
);

// Generate unique request ID for tracking
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced API wrapper with security and monitoring
export const secureApi = {
  ...api,
  
  // Enhanced POST method with security validation
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const startTime = Date.now();
    const enhancedConfig = {
      ...config,
      metadata: {
        ...config?.metadata,
        startTime,
        playerId: data?.player,
        sessionId: data?.sessionId
      }
    };

    // Security validation for sensitive endpoints
    if (url.includes('/submit-score') && data) {
      const validation = SecurityValidator.validateScoreRequest(data);
      if (!validation.valid) {
        monitoringService.logSecurityEvent(
          'validation',
          'error',
          `Score validation failed: ${validation.errors.join(', ')}`,
          { 
            errors: validation.errors,
            requestData: data,
            endpoint: url
          },
          data.player,
          data.sessionId
        );
        throw new Error(`Security validation failed: ${validation.errors.join(', ')}`);
      }
    }

    return api.post(url, data, enhancedConfig);
  },

  // Enhanced GET method with monitoring
  async get<T>(url: string, config?: any): Promise<T> {
    const startTime = Date.now();
    const enhancedConfig = {
      ...config,
      metadata: {
        ...config?.metadata,
        startTime
      }
    };

    return api.get(url, enhancedConfig);
  }
};

// API endpoints
export const apiEndpoints = {
  checkWallet: "/api/check-wallet",
  getPlayerTotalScore: "/api/get-player-total-score",
  startGameSession: "/api/start-game-session",
  endGameSession: "/api/end-game-session",
  submitScore: "/api/submit-score",
  submitScoreOnchain: "/api/submit-score-onchain",
  leaderBoard: "/api/leaderboard",
  playerRank: "/api/leaderboard/rank",
} as const;
