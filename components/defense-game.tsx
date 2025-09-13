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
import { useCrossAppAccount } from '@/hooks/useCrossAppAccount';
import { useUsername } from '@/hooks/useUsername';
import { useOnchainScoreSubmissionWithRetry } from '@/hooks/useOnchainScoreSubmission';
import { useLeaderboard } from '@/hooks/useLeaderboard';
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardPinned, setLeaderboardPinned] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { farmCoins, addFarmCoins } = useGameContext();
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const soundEffectRef = useRef<HTMLAudioElement | null>(null);
  const backgroundMusicPlayPromise = useRef<Promise<void> | null>(null);
  const soundEffectPlayPromise = useRef<Promise<void> | null>(null);
  
  // Audio state management
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [firstChapterInteraction, setFirstChapterInteraction] = useState(true);
  
  // API integration state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessingChapter, setIsProcessingChapter] = useState(false);
  
  // Use custom hooks for API integration
  const { authenticated, user, ready, logout, login } = usePrivy();
  const { walletAddress } = useCrossAppAccount();
  const { data: usernameData, error: usernameError, isLoading: usernameLoading } = useUsername(walletAddress);
  const { data: playerStats } = usePlayerTotalScore(walletAddress, gameStarted, false);
  const { data: leaderboardData } = useLeaderboard(currentPage + 1);
  const gameSession = useGameSession(sessionToken);
  const onchainSubmission = useOnchainScoreSubmissionWithRetry();

  // Calculate player's rank from leaderboard data
  const getPlayerRank = () => {
    if (!leaderboardData?.data?.data || !walletAddress) return null;
    
    const playerIndex = leaderboardData.data.data.findIndex(
      (player: any) => player.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    
    return playerIndex !== -1 ? playerIndex + 1 : null;
  };

  const playerRank = getPlayerRank();
  
  // Debug username retrieval
  console.log('Username debug info:', {
    walletAddress,
    usernameData,
    usernameError,
    usernameLoading,
    authenticated,
    ready
  });
  
  // Improved username logic with better fallback handling
  const username = usernameData?.user?.username || null;
  const displayName = username || (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Anonymous');

  // Chapter One assets (images 0-7, sounds for 1,3,5,6,7)
  const chapterAssets = [
    { image: '/ChapterOne/0.png', sound: undefined },
    { image: '/ChapterOne/1.png', sound: '/ChapterOne/1.mp3' },
    { image: '/ChapterOne/2.png', sound: undefined },
    { image: '/ChapterOne/3.png', sound: '/ChapterOne/3.mp3' },
    { image: '/ChapterOne/4.png', sound: undefined },
    { image: '/ChapterOne/5.png', sound: '/ChapterOne/5.mp3' },
    { image: '/ChapterOne/6.png', sound: '/ChapterOne/6.mp3' },
    { image: '/ChapterOne/7.png', sound: '/ChapterOne/7.mp3' }
  ];

  // Handle chapter progression (simplified like trailer implementation)
  const nextChapterSlide = useCallback(async () => {
    // Check authentication before allowing game progression
    if (!authenticated || !walletAddress) {
      toast.error('Please sign in with Monad Games ID to play!');
      login();
      return;
    }

    // Prevent rapid clicks
    if (isProcessingChapter) {
      return;
    }
    setIsProcessingChapter(true);

    try {
      // On first interaction, initialize background music and play current slide audio
      if (firstChapterInteraction) {
        // Initialize background music
        if (!backgroundMusicRef.current) {
          backgroundMusicRef.current = new Audio('/ChapterOne/background_music_chapter_one.mp3');
          backgroundMusicRef.current.loop = true;
          backgroundMusicRef.current.volume = 0.3;
          backgroundMusicPlayPromise.current = backgroundMusicRef.current.play();
          await backgroundMusicPlayPromise.current;
        }

        // Play sound effect for current slide if it exists
        if (chapterAssets[chapterIndex].sound) {
          if (soundEffectRef.current) {
            soundEffectRef.current.pause();
            soundEffectRef.current.currentTime = 0;
          }
          soundEffectRef.current = new Audio(chapterAssets[chapterIndex].sound);
          soundEffectRef.current.volume = 0.7;
          soundEffectPlayPromise.current = soundEffectRef.current.play();
          await soundEffectPlayPromise.current;
        }
        
        setFirstChapterInteraction(false);
        setIsProcessingChapter(false);
        return; // Stay on current slide after first interaction
      }

      // For subsequent interactions, advance to next slide and play its audio
      if (chapterIndex >= chapterAssets.length - 1) {
        // End of chapter, start the game
        if (backgroundMusicRef.current) {
          backgroundMusicRef.current.pause();
          backgroundMusicRef.current.currentTime = 0;
        }
        setGameMode('game');
        setGameStarted(true);
      } else {
        // Advance to next slide
        const nextIndex = chapterIndex + 1;
        setChapterIndex(nextIndex);
        
        // Play audio for the new slide if it exists
        if (chapterAssets[nextIndex].sound) {
          if (soundEffectRef.current) {
            soundEffectRef.current.pause();
            soundEffectRef.current.currentTime = 0;
          }
          soundEffectRef.current = new Audio(chapterAssets[nextIndex].sound);
          soundEffectRef.current.volume = 0.7;
          soundEffectPlayPromise.current = soundEffectRef.current.play();
          await soundEffectPlayPromise.current;
        }
      }
    } catch (error) {
      console.warn('Audio playback failed:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setAudioBlocked(true);
        toast.error('Audio blocked by browser. Click "Enable Audio" to play sounds.');
      }
      if (firstChapterInteraction) {
        setFirstChapterInteraction(false);
      }
    }
    
    setIsProcessingChapter(false);
  }, [chapterIndex, chapterAssets, firstChapterInteraction, authenticated, walletAddress]);

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
  }, [gameMode, nextChapterSlide]);

  // Reset firstChapterInteraction when entering chapter mode
  useEffect(() => {
    if (gameMode === 'chapter') {
      setFirstChapterInteraction(true);
    }
  }, [gameMode]);

  // Audio is now handled directly in nextChapterSlide on user interaction

  // Note: Audio is now handled in nextChapterSlide on user interaction
  // This prevents browser autoplay restrictions

  // Start game session when user is authenticated
  useEffect(() => {
    if (authenticated && walletAddress && !sessionId) {
      gameSession.startGameSession.mutate({ walletAddress });
    }
  }, [authenticated, walletAddress, sessionId]);

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

    // Enhanced authentication checks
    if (!authenticated || !walletAddress || !sessionToken || !sessionId) {
      console.error('Missing required data for score submission:', {
        authenticated,
        walletAddress: !!walletAddress,
        sessionToken: !!sessionToken,
        sessionId: !!sessionId
      });
      toast.error('Please sign in with Monad Games ID to submit scores!');
      login();
      return false;
    }

    // Check if user has a registered username (optional - allow submission without username)
    if (!username) {
      console.log('No username found, but allowing score submission with wallet address');
      toast.info('Consider registering a username at Monad Games ID for better leaderboard display!');
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
        try {
          // Wait for any ongoing play promise to resolve first
          if (backgroundMusicPlayPromise.current) {
            backgroundMusicPlayPromise.current.catch(() => {}).then(() => {
              if (backgroundMusicRef.current) {
                backgroundMusicRef.current.pause();
              }
              backgroundMusicPlayPromise.current = null;
            });
          } else {
            backgroundMusicRef.current.pause();
            backgroundMusicPlayPromise.current = null;
          }
        } catch (e) {
          // Ignore pause errors
        }
      }
      if (soundEffectRef.current) {
        try {
          // Wait for any ongoing play promise to resolve first
          if (soundEffectPlayPromise.current) {
            soundEffectPlayPromise.current.catch(() => {}).then(() => {
              if (soundEffectRef.current) {
                soundEffectRef.current.pause();
              }
              soundEffectPlayPromise.current = null;
            });
          } else {
            soundEffectRef.current.pause();
            soundEffectPlayPromise.current = null;
          }
        } catch (e) {
          // Ignore pause errors
        }
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

        {/* Skip button and Audio Enable button */}
        <div className="absolute top-4 md:top-8 left-4 md:left-8 z-10 flex flex-col gap-2">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              
              // Check authentication before skipping to game
              if (!authenticated || !walletAddress) {
                toast.error('Please sign in with Monad Games ID to play!');
                login();
                return;
              }
              
              if (backgroundMusicRef.current) {
                try {
                  // Wait for any ongoing play promise to resolve first
                  if (backgroundMusicPlayPromise.current) {
                     backgroundMusicPlayPromise.current.catch(() => {}).then(() => {
                       if (backgroundMusicRef.current) {
                         backgroundMusicRef.current.pause();
                         backgroundMusicRef.current.currentTime = 0;
                       }
                       backgroundMusicPlayPromise.current = null;
                       setGameMode('game');
                       setGameStarted(true);
                     });
                   } else {
                     backgroundMusicRef.current.pause();
                     backgroundMusicRef.current.currentTime = 0;
                     backgroundMusicPlayPromise.current = null;
                     setGameMode('game');
                     setGameStarted(true);
                   }
                 } catch (e) {
                   // Ignore pause errors
                   setGameMode('game');
                   setGameStarted(true);
                 }
               } else {
                 setGameMode('game');
                 setGameStarted(true);
               }
            }}
            variant="outline"
            className="bg-black/70 backdrop-blur border-white/20 text-white hover:bg-white/20 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
          >
            Skip Chapter
          </Button>
          
          {/* Audio Enable Button - only show when audio is blocked */}
          {audioBlocked && (
            <Button 
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  // Try to play background music
                  if (!backgroundMusicRef.current) {
                    backgroundMusicRef.current = new Audio('/ChapterOne/background_music_chapter_one.mp3');
                    backgroundMusicRef.current.loop = true;
                    backgroundMusicRef.current.volume = 0.3;
                  }
                  
                  backgroundMusicPlayPromise.current = backgroundMusicRef.current.play();
                  await backgroundMusicPlayPromise.current;
                  
                  // If successful, also try to play current slide sound
                  if (chapterAssets[chapterIndex].sound) {
                    if (soundEffectRef.current) {
                      soundEffectRef.current.pause();
                      soundEffectRef.current.currentTime = 0;
                    }
                    soundEffectRef.current = new Audio(chapterAssets[chapterIndex].sound);
                    soundEffectRef.current.volume = 0.7;
                    soundEffectPlayPromise.current = soundEffectRef.current.play();
                    await soundEffectPlayPromise.current;
                  }
                  
                  setAudioBlocked(false);
                  toast.success('Audio enabled successfully!');
                } catch (error) {
                  console.warn('Failed to enable audio:', error);
                  toast.error('Could not enable audio. Please check browser settings.');
                }
              }}
              variant="outline"
              className="bg-green-600/70 backdrop-blur border-green-500/20 text-white hover:bg-green-500/70 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2 animate-pulse"
            >
              🔊 Enable Audio
            </Button>
          )}
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
                <div className="flex flex-col">
                  <span className="text-white text-sm">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                  <span className="text-yellow-400 text-xs">No username registered</span>
                </div>
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
        
        {/* Enhanced Leaderboard Display */}
        <div className="relative">
          {/* Current Player Stats - Always Visible */}
          <div 
            className="bg-white/10 backdrop-blur border-white/20 rounded-lg px-4 py-2 cursor-pointer hover:bg-white/20 transition-all duration-200"
            onMouseEnter={() => !leaderboardPinned && setShowLeaderboard(true)}
            onMouseLeave={() => !leaderboardPinned && setShowLeaderboard(false)}
            onClick={() => {
              setLeaderboardPinned(!leaderboardPinned);
              setShowLeaderboard(!showLeaderboard);
            }}
          >
            <span className="text-white font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>
              Score: {gameScore > 0 ? gameScore.toLocaleString() : '0'}
            </span>
            {playerStats && (
              <div className="text-xs text-white/80 mt-1">
                Rank: #{playerRank || 'Unranked'} | Games: {playerStats.gamesPlayed}
              </div>
            )}
            <div className="text-xs text-white/60 mt-1">
              Hover or click to view leaderboard
            </div>
          </div>

          {/* Leaderboard Dropdown */}
          {showLeaderboard && (
            <div 
              className="absolute top-full right-0 mt-2 bg-white/10 backdrop-blur border-white/20 rounded-lg p-3 sm:p-4 w-80 sm:w-96 max-w-[90vw] z-50 hover:bg-white/20 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-sm">🏆 Leaderboard</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowLeaderboard(false);
                      setLeaderboardPinned(false);
                    }}
                    className="sm:hidden px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-white rounded transition-colors"
                    title="Close leaderboard"
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!leaderboardData?.data?.data || leaderboardData.data.data.length < 10}
                    className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
              
              {/* Leaderboard List */}
              <div className="space-y-1 max-h-64 overflow-hidden">
                {leaderboardData?.data?.data && leaderboardData.data.data.length > 0 ? (
                  leaderboardData.data.data
                    .map((player: any, index: number) => {
                      const globalRank = currentPage * 10 + index + 1;
                      const isCurrentPlayer = player.walletAddress === walletAddress;
                      return (
                        <div
                          key={player.walletAddress}
                          className={`flex items-center justify-between p-2 rounded text-xs transition-colors ${
                            isCurrentPlayer 
                              ? 'bg-yellow-500/20 border border-yellow-500/40' 
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`font-bold ${
                              globalRank === 1 ? 'text-yellow-400' :
                              globalRank === 2 ? 'text-gray-300' :
                              globalRank === 3 ? 'text-orange-400' :
                              'text-white'
                            }`}>
                              #{globalRank}
                            </span>
                            <span className="text-white truncate">
                              {player.username || `${player.walletAddress.slice(0, 6)}...${player.walletAddress.slice(-4)}`}
                            </span>
                            {isCurrentPlayer && (
                              <span className="text-yellow-400 text-xs">(You)</span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">
                              {player.score.toLocaleString()}
                            </div>
                            <div className="text-white/60 text-xs">
                              Best Score
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-white/60 text-center py-4">
                    No leaderboard data available
                  </div>
                )}
              </div>
              
              {/* Current Player Position Indicator */}
              {playerRank && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="text-xs text-white/80 text-center">
                    Your position: #{playerRank}
                    {currentPage * 10 + 1 > playerRank || (currentPage + 1) * 10 < playerRank ? (
                      <button
                        onClick={() => setCurrentPage(Math.floor((playerRank - 1) / 10))}
                        className="ml-2 text-yellow-400 hover:text-yellow-300 underline"
                      >
                        Go to your rank
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
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
        {!authenticated || !walletAddress ? (
          <div className="text-center text-white">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4">🛡️ Mon Defense</h2>
              <p className="text-lg mb-6">Sign in with Monad Games ID to start playing!</p>
              <Button 
                onClick={login}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                Sign in with Monad Games ID
              </Button>
            </div>
          </div>
        ) : gameMode === 'game' && gameStarted ? (
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
                    // Add coins for game mechanics, but score is handled by scoreUpdate event
                    addFarmCoins(data);
                  }
                  break;
                case 'enemyDefeated':
                  // Score is now handled by scoreUpdate event for proper synchronization
                  // This event can be used for other enemy defeat effects if needed
                  break;
                case 'waveComplete':
                  if (data && typeof data === 'object' && data.wave && data.score) {
                    // Sync with the actual Phaser game score instead of calculating separately
                    setGameScore(data.score);
                    toast.success(`Wave ${data.wave} completed!`);
                  }
                  break;
                case 'scoreUpdate':
                  if (data && typeof data === 'number') {
                    // Sync React score with Phaser game score
                    setGameScore(data);
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