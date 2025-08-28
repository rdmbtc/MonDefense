"use client";

import { useEffect } from 'react';

export function ConfigChecker() {
  useEffect(() => {
    // Check for required environment variables or configurations
    const requiredEnvVars = [
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_PRIVY_APP_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => {
      const value = process.env[varName];
      return !value || value === 'undefined';
    });

    if (missingVars.length > 0) {
      console.warn('Missing environment variables:', missingVars);
    }
  }, []);

  // This component doesn't render anything visible
  return null;
}