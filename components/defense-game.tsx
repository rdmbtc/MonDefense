"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGameContext } from "@/context/game-context";
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

// Extend Window interface to include custom properties
declare global {
  interface Window {
    _defenseMode?: boolean;
    _farmMode?: boolean;
  }
}

// Dynamically import the ClientWrapper to avoid SSR issues
const ClientWrapper = dynamic(() => import('./farm-game/ClientWrapper'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-900 to-purple-900">
      <div className="text-white text-center">
        <div className="mb-4">Loading Defense Game...</div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
      </div>
    </div>
  )
});

interface DefenseGameProps {
  onBack: () => void;
}

export default function DefenseGame({ onBack }: DefenseGameProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const { farmCoins, addFarmCoins } = useGameContext();

  useEffect(() => {
    // Auto-start the defense game when component mounts
    setGameStarted(true);
    
    // Initialize game state for defense mode
    if (typeof window !== 'undefined') {
      // Set up defense-specific global state
      window._defenseMode = true;
      window._farmMode = false;
    }

    return () => {
      // Cleanup when component unmounts
      if (typeof window !== 'undefined') {
        window._defenseMode = false;
        
        // Clean up any running game instances
        if (window.game && window.game.destroy) {
          try {
            window.game.destroy(true);
            window.game = null;
          } catch (error) {
            console.warn('Error destroying game:', error);
          }
        }
      }
    };
  }, []);

  const handleBackToMenu = () => {
    // Clean up game before going back
    if (typeof window !== 'undefined' && window.game) {
      try {
        window.game.destroy(true);
        window.game = null;
      } catch (error) {
        console.warn('Error destroying game on back:', error);
      }
    }
    onBack();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900">
      {/* Header with back button and game info */}
      <div className="absolute top-4 left-4 z-50">
        <Button 
          onClick={handleBackToMenu}
          variant="outline"
          className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
        >
          ← Back to Menu
        </Button>
      </div>
      
      <div className="absolute top-4 right-4 z-50">
        <div className="bg-white/10 backdrop-blur border-white/20 rounded-lg px-4 py-2">
          <span className="text-white font-bold">Coins: {farmCoins}</span>
        </div>
      </div>

      {/* Game Title */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <h1 className="text-2xl font-bold text-white text-center">
          MonDefense - Tower Defense
        </h1>
      </div>

      {/* Game Container */}
      <div className="w-full h-screen">
        {gameStarted ? (
          <ClientWrapper 
            key="defense-game-instance"
            farmCoins={farmCoins}
            addFarmCoins={addFarmCoins}
            gameMode="defense"
            onGameEvent={(event: string, data: any) => {
              // Handle game events
              switch (event) {
                case 'coinsEarned':
                  if (data && typeof data === 'number') {
                    addFarmCoins(data);
                  }
                  break;
                case 'gameOver':
                  toast.success('Game Over! Thanks for playing!');
                  break;
                case 'waveComplete':
                  toast.success(`Wave ${data} completed!`);
                  break;
                default:
                  break;
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-center">
              <div className="mb-4">Initializing Defense Game...</div>
              <div className="animate-pulse">🛡️</div>
            </div>
          </div>
        )}
      </div>

      {/* Game Instructions Overlay (initially hidden, can be toggled) */}
      <div className="absolute bottom-4 left-4 z-50">
        <div className="bg-black/50 backdrop-blur rounded-lg p-3 text-white text-sm max-w-xs">
          <div className="font-bold mb-2">Controls:</div>
          <div>• Click to attack enemies</div>
          <div>• Place towers to defend</div>
          <div>• Survive all waves to win!</div>
        </div>
      </div>
    </div>
  );
}