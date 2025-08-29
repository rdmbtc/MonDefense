"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGameContext } from "@/context/game-context";
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { 
  usePrivy, 
  CrossAppAccountWithMetadata, 
} from "@privy-io/react-auth";
import { useGameSession } from '@/hooks/useGameSession';
import { usePlayerTotalScore } from '@/hooks/usePlayerTotalScore';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useCrossAppAccount } from '@/hooks/useCrossAppAccount';
import { useUsername } from '@/hooks/useUsername';
import { useOnchainScoreSubmissionWithRetry } from '@/hooks/useOnchainScoreSubmission';
import { GAME_CONFIG } from '@/lib/game-config';

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

import { DefenseGameProps, GameEventType } from '@/types';

export default function DefenseGame({ onBack, onGameEnd }: DefenseGameProps) {
  const [gameMode, setGameMode] = useState<'chapter' | 'game'>('chapter');
  const [chapterIndex, setChapterIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const { farmCoins, addFarmCoins } = useGameContext();
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const soundEffectRef = useRef<HTMLAudioElement | null>(null);
  
  // API integration state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Use custom hooks for API integration
  const { authenticated, user, ready, logout, login } = usePrivy();
  const { walletAddress } = useCrossAppAccount();
  const { data: usernameData, error: usernameError, isLoading: usernameLoading } = useUsername(walletAddress);
  const { data: playerStats } = usePlayerTotalScore(walletAddress, gameStarted, false);
  const { data: leaderboardData } = useLeaderboard(1);
  const gameSession = useGameSession(sessionToken);
  const onchainSubmission = useOnchainScoreSubmissionWithRetry();
  
  // Debug username retrieval
  console.log('Username debug info:', {
    walletAddress,
    usernameData,
    usernameError,
    usernameLoading,
    authenticated,
    ready
  });
  
  const username = usernameData?.user?.username || 'Anonymous';

  // Chapter One assets (images 0-7, sounds for 1,3,5,6,7)
  const chapterAssets = [
    { image: '/Chapter One/0.png', sound: null },
    { image: '/Chapter One/1.png', sound: '/Chapter One/1.wav' },
    { image: '/Chapter One/2.png', sound: null },
    { image: '/Chapter One/3.png', sound: '/Chapter One/3.wav' },
    { image: '/Chapter One/4.png', sound: null },
    { image: '/Chapter One/5.png', sound: '/Chapter One/5.wav' },
    { image: '/Chapter One/6.png', sound: '/Chapter One/6.wav' },
    { image: '/Chapter One/7.png', sound: '/Chapter One/7.wav' }
  ];

  // Handle chapter progression
  const nextChapterSlide = useCallback(async () => {
    try {
      // Initialize and play background music on first slide with user interaction
      if (chapterIndex === 0 && !backgroundMusicRef.current) {
        // Try multiple background music sources
        const bgMusicSources = [
          '/Chapter One/background_music_chapter_one.mp3',
          '/assets/bg_music.mp3',
          '/assets/sounds/game/bgm_gameplay.mp3'
        ];
        
        for (const source of bgMusicSources) {
          try {
            backgroundMusicRef.current = new Audio(source);
            backgroundMusicRef.current.loop = true;
            backgroundMusicRef.current.volume = 0.3;
            await backgroundMusicRef.current.play();
            console.log('Background music loaded successfully:', source);
            break;
          } catch (bgError) {
            console.warn('Failed to load background music from:', source, bgError);
            backgroundMusicRef.current = null;
          }
        }
      } else if (chapterIndex === 0 && backgroundMusicRef.current && backgroundMusicRef.current.paused) {
        await backgroundMusicRef.current.play();
      }

      // Play sound effect for current slide if it exists (on user interaction)
      if (chapterAssets[chapterIndex].sound) {
        if (soundEffectRef.current) {
          soundEffectRef.current.pause();
          soundEffectRef.current.currentTime = 0;
        }
        
        try {
          soundEffectRef.current = new Audio(chapterAssets[chapterIndex].sound!);
          soundEffectRef.current.volume = 0.7;
          await soundEffectRef.current.play();
          console.log('Sound effect played:', chapterAssets[chapterIndex].sound);
        } catch (sfxError) {
          console.warn('Failed to play sound effect:', chapterAssets[chapterIndex].sound, sfxError);
        }
      }
    } catch (error) {
      console.warn('Chapter audio playback failed:', error);
    }

    // Advance to next slide after a short delay to let audio start
    setTimeout(() => {
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
    }, 100);
  }, [chapterIndex, chapterAssets]);

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

  // Audio is now handled directly in nextChapterSlide on user interaction

  // Note: Audio is now handled in nextChapterSlide on user interaction
  // This prevents browser autoplay restrictions

  // Start game session when user is authenticated
  useEffect(() => {
    if (authenticated && walletAddress && !sessionId) {
      gameSession.startGameSession.mutate({ walletAddress });
    }
  }, [authenticated, walletAddress, sessionId, gameSession.startGameSession]);

  // Handle session token from game session hook
  useEffect(() => {
    if (gameSession.startGameSession.data?.sessionToken) {
      setSessionToken(gameSession.startGameSession.data.sessionToken);
      setSessionId(gameSession.startGameSession.data.sessionId);
    }
  }, [gameSession.startGameSession.data]);

  // Handle score submission using both API and on-chain submission
  const handleScoreSubmission = useCallback(async (score: number, transactionCount: number = 1): Promise<boolean> => {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('Score submission already in progress, ignoring duplicate call');
      return false;
    }

    if (!walletAddress || !sessionToken || !sessionId) {
      toast.error('Authentication required for score submission');
      return false;
    }

    try {
      setIsSubmitting(true);
      console.log('Submitting score via API and on-chain:', score);
      
      // Submit to existing API
      await gameSession.submitScore.mutateAsync({
        player: walletAddress,
        scoreAmount: score,
        transactionAmount: transactionCount,
        sessionId: sessionId
      });

      // Submit to Monad Games ID smart contract on-chain
      try {
        const onchainResult = await onchainSubmission.submitWithRetry(
          walletAddress,
          score,
          transactionCount,
          2 // max retries
        );
        
        if (onchainResult.success) {
          console.log('On-chain submission successful:', {
            transactionHash: onchainResult.transactionHash,
            gameId: GAME_CONFIG.BLOCKCHAIN.GAME_ID
          });
          toast.success(`Score submitted! TX: ${onchainResult.transactionHash?.slice(0, 8)}...`);
        } else {
          console.warn('On-chain submission failed, but API submission succeeded');
          toast.success('Score submitted to API (on-chain failed)');
        }
      } catch (onchainError) {
        console.warn('On-chain submission failed:', onchainError);
        toast.success('Score submitted to API (on-chain failed)');
      }

      setHasSubmittedScore(true);
      return true;
    } catch (error) {
      console.error('Error submitting score:', error);
      toast.error('Score submission failed');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [walletAddress, sessionToken, sessionId, gameSession.submitScore, isSubmitting]);



  useEffect(() => {
    // Initialize game state for defense mode when game starts
    if (gameMode === 'game') {
      if (typeof window !== 'undefined') {
        // Set up defense-specific global state
        window._defenseMode = true;
        window._farmMode = false;
      }
      
      // Reset submission state for new game
      setHasSubmittedScore(false);
      
      // Expose global function for Phaser game to call directly
      window.submitGameScore = async (score: number, transactionCount: number): Promise<boolean> => {
        try {
          // Prevent multiple submissions - check if already submitted or submitting
          if (hasSubmittedScore || isSubmitting) {
            console.log('Score already submitted or submission in progress');
            return false;
          }

          // Only submit if user is authenticated and has session token
          if (walletAddress && sessionToken && sessionId) {
            const result = await handleScoreSubmission(score, transactionCount);
            return result;
          }
          return false;
        } catch (error) {
          console.error('Error in global score submission:', error);
          return false;
        }
      };
      
      return () => {
        // Remove global function
        if (window.submitGameScore) {
          delete window.submitGameScore;
        }
      };
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
  }, [gameMode, walletAddress, sessionToken, sessionId, hasSubmittedScore, isSubmitting, handleScoreSubmission]);



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
      
      <div className="absolute top-4 right-4 z-50 flex gap-4 items-center">
        {/* Authentication Status */}
        <div className="bg-white/10 backdrop-blur border-white/20 rounded-lg px-4 py-2">
          {!ready ? (
            <span className="text-white text-sm">Loading...</span>
          ) : !authenticated ? (
            <div className="flex items-center gap-2">
              <Button 
                onClick={login}
                variant="outline"
                size="sm"
                className="bg-blue-600/80 hover:bg-blue-700/80 text-white border-blue-500/50"
              >
                Sign in with Monad Games ID
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {username ? (
                <span className="text-white text-sm font-medium">Welcome, {username}!</span>
              ) : walletAddress ? (
                <span className="text-white text-sm">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              ) : (
                <span className="text-white text-sm">Authenticated</span>
              )}
              <Button 
                onClick={logout}
                variant="outline"
                size="sm"
                className="bg-red-600/80 hover:bg-red-700/80 text-white border-red-500/50 ml-2"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
        
        {/* Score Display */}
        <div className="bg-white/10 backdrop-blur border-white/20 rounded-lg px-4 py-2">
          <span className="text-white font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>Score: {gameScore.toLocaleString()}</span>
          {playerStats && (
            <div className="text-xs text-white/80 mt-1">
              Best: {parseInt(playerStats.bestScore).toLocaleString()} | Games: {playerStats.gamesPlayed}
            </div>
          )}
        </div>
        

      </div>

      {/* Game Title */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <h1 className="text-2xl font-bold text-white text-center" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
          {GAME_CONFIG.METADATA.name}
        </h1>
      </div>

      {/* Username Registration Message */}
      {authenticated && walletAddress && usernameData && !usernameData.hasUsername && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <div className="bg-yellow-600/90 backdrop-blur border-yellow-500/50 rounded-lg px-4 py-3 text-center">
            <p className="text-white text-sm font-medium mb-2">No username found for your account</p>
            <Button 
              onClick={() => window.open('https://monad-games-id-site.vercel.app/', '_blank')}
              variant="outline"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              Register Username
            </Button>
          </div>
        </div>
      )}

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
                    // Add to both coins (for game mechanics) and score (for leaderboard)
                    addFarmCoins(data);
                    setGameScore(prev => prev + data * 10); // Score is 10x coins earned
                  }
                  break;
                case 'enemyDefeated':
                  if (data && typeof data === 'number') {
                    setGameScore(prev => prev + data); // Direct score from enemy defeat
                  }
                  break;
                case 'waveComplete':
                  if (data && typeof data === 'number') {
                    const waveBonus = data * 100; // Bonus points per wave
                    setGameScore(prev => {
                      const newScore = prev + waveBonus;
                      toast.success(`Wave ${data} completed! +${waveBonus} bonus points!`);
                      return newScore;
                    });
                  }
                  break;
                case 'gameOver':
                  toast.success('Game Over! Thanks for playing!');
                  if (onGameEnd && gameScore > 0) {
                    onGameEnd(gameScore);
                  }
                  // Score submission is handled by the Phaser game's submit button
                  break;
                case 'gameWon':
                  const victoryBonus = 5000;
                  const finalScore = gameScore + victoryBonus;
                  setGameScore(finalScore);
                  toast.success(`Victory! +${victoryBonus} victory bonus!`);
                  if (onGameEnd) {
                    onGameEnd(finalScore);
                  }
                  // Score submission is handled by the Phaser game's submit button
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