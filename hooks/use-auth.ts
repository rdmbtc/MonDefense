import { useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';

interface AuthState {
  isAuthenticating: boolean;
  sessionToken: string | null;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  authenticate: (playerAddress: string) => Promise<string>;
  clearSession: () => void;
  isSessionValid: (playerAddress: string) => boolean;
}

export function useAuth(): UseAuthReturn {
  const { signMessage } = usePrivy();
  const [state, setState] = useState<AuthState>({
    isAuthenticating: false,
    sessionToken: null,
    error: null
  });

  const isSessionValid = useCallback((playerAddress: string): boolean => {
    const cachedToken = localStorage.getItem(`session_${playerAddress}`);
    const cachedExpiry = localStorage.getItem(`session_${playerAddress}_expiry`);
    
    if (!cachedToken || !cachedExpiry) {
      return false;
    }
    
    return Date.now() < parseInt(cachedExpiry);
  }, []);

  const authenticate = useCallback(async (playerAddress: string): Promise<string> => {
    try {
      setState(prev => ({ ...prev, isAuthenticating: true, error: null }));
      
      // Check if we have a valid cached session token
      if (isSessionValid(playerAddress)) {
        const cachedToken = localStorage.getItem(`session_${playerAddress}`)!;
        setState(prev => ({ ...prev, sessionToken: cachedToken, isAuthenticating: false }));
        return cachedToken;
      }
      
      // Authentication API has been removed
      throw new Error('Authentication API has been removed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to authenticate';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isAuthenticating: false
      }));
      throw new Error(errorMessage);
    }
  }, [signMessage, isSessionValid]);

  const clearSession = useCallback(() => {
    setState({
      isAuthenticating: false,
      sessionToken: null,
      error: null
    });
    
    // Clear all cached sessions
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('session_')) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  return {
    ...state,
    authenticate,
    clearSession,
    isSessionValid
  };
}