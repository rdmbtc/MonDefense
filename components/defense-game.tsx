"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const [gameMode, setGameMode] = useState<'chapter' | 'game'>('chapter');
  const [chapterIndex, setChapterIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const { farmCoins, addFarmCoins } = useGameContext();
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const soundEffectRef = useRef<HTMLAudioElement | null>(null);

  // Chapter One assets (images 0-7, sounds for 1,3,5,6,7)
  const chapterAssets = [
    { image: '/Chapter%20One/0.png', sound: null },
    { image: '/Chapter%20One/1.png', sound: '/Chapter%20One/1.wav' },
    { image: '/Chapter%20One/2.png', sound: null },
    { image: '/Chapter%20One/3.png', sound: '/Chapter%20One/3.wav' },
    { image: '/Chapter%20One/4.png', sound: null },
    { image: '/Chapter%20One/5.png', sound: '/Chapter%20One/5.wav' },
    { image: '/Chapter%20One/6.png', sound: '/Chapter%20One/6.wav' },
    { image: '/Chapter%20One/7.png', sound: '/Chapter%20One/7.wav' }
  ];

  // Handle chapter progression
  const nextChapterSlide = useCallback(async () => {
    // Ensure audio context is activated on user interaction
    if (chapterIndex === 0 && backgroundMusicRef.current && backgroundMusicRef.current.paused) {
      try {
        await backgroundMusicRef.current.play();
      } catch (error) {
        console.warn('Background music failed to start:', error);
      }
    }

    if (chapterIndex < chapterAssets.length - 1) {
      setChapterIndex(chapterIndex + 1);
    } else {
      // End of chapter, start the game
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.currentTime = 0;
      }
      setGameMode('game');
      setGameStarted(true);
    }
  }, [chapterIndex, chapterAssets.length]);

  // Handle keyboard events for chapter
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameMode === 'chapter' && event.code === 'Space') {
        event.preventDefault();
        nextChapterSlide();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameMode, chapterIndex, nextChapterSlide]);

  // Initialize and play audio
  const playChapterAudio = useCallback(async () => {
    try {
      // Initialize background music on first slide
      if (chapterIndex === 0 && !backgroundMusicRef.current) {
        backgroundMusicRef.current = new Audio('/Chapter%20One/background_music_chapter_one.mp3');
        backgroundMusicRef.current.loop = true;
        backgroundMusicRef.current.volume = 0.3;
        await backgroundMusicRef.current.play();
      }

      // Play sound effect for current slide if it exists
      if (chapterAssets[chapterIndex].sound) {
        if (soundEffectRef.current) {
          soundEffectRef.current.pause();
          soundEffectRef.current.currentTime = 0;
        }
        soundEffectRef.current = new Audio(chapterAssets[chapterIndex].sound!);
        soundEffectRef.current.volume = 0.7;
        await soundEffectRef.current.play();
      }
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, [chapterIndex]);

  // Play background music and sound effects for chapter
  useEffect(() => {
    if (gameMode === 'chapter') {
      playChapterAudio();
    }
  }, [gameMode, chapterIndex, playChapterAudio]);

  useEffect(() => {
    // Initialize game state for defense mode when game starts
    if (gameMode === 'game') {
      if (typeof window !== 'undefined') {
        // Set up defense-specific global state
        window._defenseMode = true;
        window._farmMode = false;
      }
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
      
      // Clean up audio
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
      }
      if (soundEffectRef.current) {
        soundEffectRef.current.pause();
      }
    };
  }, [gameMode]);

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

  // Chapter One intro screen
  if (gameMode === 'chapter') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center cursor-pointer relative overflow-hidden bg-black"
        onClick={nextChapterSlide}
      >
        {/* Mobile-responsive image container */}
        <div 
          className="md:hidden w-full h-full absolute inset-0"
          style={{
            backgroundImage: `url(${chapterAssets[chapterIndex].image})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Desktop overlay for better coverage */}
        <div 
          className="hidden md:block w-full h-full absolute inset-0"
          style={{
            backgroundImage: `url(${chapterAssets[chapterIndex].image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Click or spacebar instruction */}
        <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 px-4 z-10">
          <div className="bg-black/70 backdrop-blur px-4 md:px-6 py-2 md:py-3 rounded-lg border border-white/20">
            <p className="text-white text-center text-sm md:text-lg font-medium">
              Click or press Spacebar to continue
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="absolute top-4 md:top-8 right-4 md:right-8 z-10">
          <div className="bg-black/70 backdrop-blur px-3 md:px-4 py-1 md:py-2 rounded-lg border border-white/20">
            <p className="text-white text-xs md:text-sm">
              {chapterIndex + 1} / {chapterAssets.length}
            </p>
          </div>
        </div>

        {/* Skip button */}
        <div className="absolute top-4 md:top-8 left-4 md:left-8 z-10">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              if (backgroundMusicRef.current) {
                backgroundMusicRef.current.pause();
                backgroundMusicRef.current.currentTime = 0;
              }
              setGameMode('game');
              setGameStarted(true);
            }}
            variant="outline"
            className="bg-black/70 backdrop-blur border-white/20 text-white hover:bg-white/20 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
          >
            Skip Chapter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: 'url(/BG/background_menu.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
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
          <span className="text-white font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>Coins: {farmCoins}</span>
        </div>
      </div>

      {/* Game Title */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <h1 className="text-2xl font-bold text-white text-center" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
          MonDefense - Tower Defense
        </h1>
      </div>

      {/* Game Container */}
      <div className="w-full h-screen flex items-center justify-center">
        {gameMode === 'game' && gameStarted ? (
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
          <div className="font-bold mb-2" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>Controls:</div>
          <div style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>• Click to attack enemies</div>
          <div style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>• Place towers to defend</div>
          <div style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>• Survive all waves to win!</div>
        </div>
      </div>
    </div>
  );
}