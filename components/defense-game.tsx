"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGameContext } from "@/context/game-context";
import { useGameScoreContract } from '@/hooks/use-game-score-contract';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { 
  usePrivy, 
  CrossAppAccountWithMetadata, 
} from "@privy-io/react-auth";

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
  onGameEnd?: (score: number) => void;
}

export default function DefenseGame({ onBack, onGameEnd }: DefenseGameProps) {
  const [gameMode, setGameMode] = useState<'chapter' | 'game'>('chapter');
  const [chapterIndex, setChapterIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const { farmCoins, addFarmCoins } = useGameContext();
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const soundEffectRef = useRef<HTMLAudioElement | null>(null);
  
  // Privy authentication
  const { authenticated, user, ready, logout, login } = usePrivy();
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  
  // GameScore contract integration
  const {
    isSubmitting,
    playerStats,
    globalStats,
    submitScore,
    fetchPlayerStats,
    fetchGlobalStats,
    ensureCorrectNetwork
  } = useGameScoreContract();
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);

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

  // Handle Privy authentication and wallet address extraction
  useEffect(() => {
    // Check if privy is ready and user is authenticated
    if (authenticated && user && ready) {
      // Check if user has linkedAccounts
      if (user.linkedAccounts.length > 0) {
        // Get the cross app account created using Monad Games ID
        const crossAppAccount: CrossAppAccountWithMetadata = user.linkedAccounts.filter(
          account => account.type === "cross_app" && account.providerApp.id === "cmd8euall0037le0my79qpz42"
        )[0] as CrossAppAccountWithMetadata;

        // The first embedded wallet created using Monad Games ID, is the wallet address
        if (crossAppAccount && crossAppAccount.embeddedWallets.length > 0) {
          const walletAddress = crossAppAccount.embeddedWallets[0].address;
          setAccountAddress(walletAddress);
          
          // Fetch username from Monad Games ID API
          fetchUsername(walletAddress);
        }
      } else {
        setMessage("You need to link your Monad Games ID account to continue.");
      }
    }
  }, [authenticated, user, ready]);

  // Function to fetch username from Monad Games ID API
  const fetchUsername = async (walletAddress: string) => {
    try {
      const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`);
      const data = await response.json();
      
      if (data.hasUsername && data.user) {
        setUsername(data.user.username);
        setMessage("");
        
        // Fetch player stats when username is loaded
        await fetchPlayerStats(walletAddress);
      } else {
        setMessage("No username found. Please register at Monad Games ID.");
      }
    } catch (error) {
      console.error('Error fetching username:', error);
      setMessage("Error fetching username. Please try again.");
    }
  };

  // Function to handle score submission to blockchain
  const handleScoreSubmission = useCallback(async (finalScore: number) => {
    if (!authenticated || !accountAddress || hasSubmittedScore || finalScore <= 0) {
      return;
    }

    try {
      // Calculate transaction count (simple heuristic based on score)
      const transactionCount = Math.max(1, Math.floor(finalScore / 1000));
      
      const success = await submitScore(finalScore, transactionCount);
      
      if (success) {
        setHasSubmittedScore(true);
        toast.success(`Score ${finalScore.toLocaleString()} submitted to blockchain!`);
        
        // Refresh stats after submission
        if (accountAddress) {
          await fetchPlayerStats(accountAddress);
        }
        await fetchGlobalStats();
      }
    } catch (error) {
      console.error('Error submitting score to blockchain:', error);
    }
  }, [authenticated, accountAddress, hasSubmittedScore, submitScore, fetchPlayerStats, fetchGlobalStats]);

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
      
      // Add event listener for blockchain submission from Phaser game
      const handleBlockchainSubmission = (event: CustomEvent) => {
        const { score, waves } = event.detail;
        console.log('Received blockchain submission request:', { score, waves });
        handleScoreSubmission(score);
      };
      
      window.addEventListener('submitToBlockchain', handleBlockchainSubmission as EventListener);
      
      return () => {
        // Remove blockchain event listener
        window.removeEventListener('submitToBlockchain', handleBlockchainSubmission as EventListener);
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
  }, [gameMode, handleScoreSubmission]);

  // Fetch global stats on component mount
  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats]);

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
              ) : accountAddress ? (
                <span className="text-white text-sm">{accountAddress.slice(0, 6)}...{accountAddress.slice(-4)}</span>
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
        
        {/* Blockchain Status */}
        {authenticated && accountAddress && (
          <div className="bg-white/10 backdrop-blur border-white/20 rounded-lg px-4 py-2">
            <div className="text-white text-sm font-medium">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Submitting to blockchain...
                </span>
              ) : hasSubmittedScore ? (
                <span className="text-green-400">✓ Score on blockchain</span>
              ) : gameScore > 0 ? (
                <Button
                  onClick={() => handleScoreSubmission(gameScore)}
                  size="sm"
                  className="bg-blue-600/80 hover:bg-blue-700/80 text-white border-blue-500/50 text-xs px-2 py-1"
                  disabled={isSubmitting}
                >
                  Submit to Blockchain
                </Button>
              ) : (
                <span className="text-white/60">Ready for blockchain</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Game Title */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <h1 className="text-2xl font-bold text-white text-center" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
          MonDefense - Tower Defense
        </h1>
      </div>

      {/* Message Display */}
      {message && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <div className="bg-yellow-600/90 backdrop-blur border-yellow-500/50 rounded-lg px-4 py-3 text-center">
            <p className="text-white text-sm font-medium mb-2">{message}</p>
            {message.includes("No username found") && (
              <Button 
                onClick={() => window.open('https://monad-games-id-site.vercel.app/', '_blank')}
                variant="outline"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                Register Username
              </Button>
            )}
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
                    setGameScore(prev => prev + waveBonus);
                    toast.success(`Wave ${data} completed! +${waveBonus} bonus points!`);
                  }
                  break;
                case 'gameOver':
                  toast.success('Game Over! Thanks for playing!');
                  if (onGameEnd && gameScore > 0) {
                    onGameEnd(gameScore);
                  }
                  // Submit score to blockchain
                  handleScoreSubmission(gameScore);
                  break;
                case 'gameWon':
                  const victoryBonus = 5000;
                  const finalScore = gameScore + victoryBonus;
                  setGameScore(finalScore);
                  toast.success(`Victory! +${victoryBonus} victory bonus!`);
                  if (onGameEnd) {
                    onGameEnd(finalScore);
                  }
                  // Submit final score to blockchain
                  handleScoreSubmission(finalScore);
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