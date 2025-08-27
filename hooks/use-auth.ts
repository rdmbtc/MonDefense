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
      
      // Get nonce from server
      const nonceResponse = await fetch(`/api/auth/session?address=${playerAddress}`);
      const nonceData = await nonceResponse.json();
      
      if (!nonceData.success) {
        throw new Error(nonceData.error || 'Failed to get nonce');
      }
      
      if (!signMessage) {
        throw new Error('Wallet not connected or signing not available');
      }
      
      // Ask user to sign the message
      const signature = await signMessage(nonceData.message);
      
      // Send signature to server to get session token
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerAddress,
          signature,
          nonce: nonceData.nonce
        })
      });
      
      const sessionData = await sessionResponse.json();
      
      if (!sessionData.success) {
        throw new Error(sessionData.error || 'Failed to create session');
      }
      
      // Cache the session token
      localStorage.setItem(`session_${playerAddress}`, sessionData.sessionToken);
      localStorage.setItem(`session_${playerAddress}_expiry`, sessionData.expiresAt.toString());
      
      setState(prev => ({
        ...prev,
        sessionToken: sessionData.sessionToken,
        isAuthenticating: false
      }));
      
      return sessionData.sessionToken;
      
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