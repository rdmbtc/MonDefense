"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';

// Dynamically import the defense game component
const DefenseGame = dynamic(() => import('./defense-game'), {
  ssr: false,
  loading: () => <div className="text-white text-center">Loading Defense Game...</div>
});

export default function HomePage() {
  const [gameMode, setGameMode] = useState<'intro' | 'trailer' | 'home' | 'defense'>('intro');
  const [trailerIndex, setTrailerIndex] = useState(0);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const soundEffectRef = useRef<HTMLAudioElement | null>(null);

  // Trailer images and sounds (0-4)
  const trailerAssets = [
    { image: '/Trailer/0.png', sound: '/Trailer/0.wav' },
    { image: '/Trailer/1.png', sound: '/Trailer/1.wav' },
    { image: '/Trailer/2.png', sound: '/Trailer/2.wav' },
    { image: '/Trailer/3.png', sound: '/Trailer/3.wav' },
    { image: '/Trailer/4.png', sound: '/Trailer/4.wav' }
  ];

  // Handle watch trailer button
  const startTrailer = useCallback(async () => {
    setGameMode('trailer');
    setTrailerIndex(0);
    // Audio will be handled by playAudio when user clicks/presses space
  }, []);

  // Handle skip trailer button
  const skipTrailer = useCallback(() => {
    setGameMode('home');
  }, []);

  // Initialize and play audio
  const playAudio = useCallback(async (userInteracted = false) => {
    try {
      // Initialize background music on first slide only after user interaction
      if (trailerIndex === 0 && !backgroundMusicRef.current && userInteracted) {
        backgroundMusicRef.current = new Audio('/Trailer/background_music_trailer.mp3');
        backgroundMusicRef.current.loop = true;
        backgroundMusicRef.current.volume = 0.3;
        await backgroundMusicRef.current.play();
      }

      // Play sound effect for current slide only after user interaction
      if (userInteracted) {
        if (soundEffectRef.current) {
          soundEffectRef.current.pause();
          soundEffectRef.current.currentTime = 0;
        }
        soundEffectRef.current = new Audio(trailerAssets[trailerIndex].sound);
        soundEffectRef.current.volume = 0.7;
        await soundEffectRef.current.play();
      }
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, [trailerIndex, trailerAssets]);

  // Handle trailer progression
  const nextTrailerSlide = useCallback(async () => {
    // Play audio on user interaction
    await playAudio(true);

    if (trailerIndex < trailerAssets.length - 1) {
      setTrailerIndex(trailerIndex + 1);
    } else {
      // End of trailer, go to main menu
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.currentTime = 0;
      }
      setGameMode('home');
    }
  }, [trailerIndex, trailerAssets.length, playAudio]);

  // Handle keyboard events for trailer
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameMode === 'trailer' && event.code === 'Space') {
        event.preventDefault();
        nextTrailerSlide();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameMode, trailerIndex, nextTrailerSlide]);

  // Initialize audio elements but don't play automatically
  useEffect(() => {
    if (gameMode === 'trailer') {
      // Just initialize without playing - audio will play on user interaction
      playAudio(false);
    }
  }, [gameMode, trailerIndex, playAudio]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
      }
      if (soundEffectRef.current) {
        soundEffectRef.current.pause();
      }
    };
  }, []);

  if (gameMode === 'defense') {
    return <DefenseGame onBack={() => setGameMode('home')} />;
  }

  if (gameMode === 'intro') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black"
      >
        {/* Mobile-responsive intro image container */}
        <div 
          className="md:hidden w-full h-full absolute inset-0"
          style={{
             backgroundImage: 'url(/Trailer/-0.svg)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Desktop intro image container */}
        <div 
          className="hidden md:block w-full h-full absolute inset-0"
          style={{
             backgroundImage: 'url(/Trailer/-0.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Buttons container */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col sm:flex-row gap-4 z-10">
          <Button 
            onClick={startTrailer}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg"
          >
            Watch Trailer
          </Button>
          <Button 
            onClick={skipTrailer}
            variant="outline"
            className="bg-gray-800/80 hover:bg-gray-700/80 text-white border-white/30 px-8 py-3 text-lg font-semibold rounded-lg shadow-lg"
          >
            Skip Trailer
          </Button>
        </div>
      </div>
    );
  }

  if (gameMode === 'trailer') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center cursor-pointer relative overflow-hidden bg-black"
        onClick={nextTrailerSlide}
      >
        {/* Mobile-responsive image container */}
        <div 
          className="md:hidden w-full h-full absolute inset-0"
          style={{
            backgroundImage: `url(${trailerAssets[trailerIndex].image})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* Desktop overlay for better coverage */}
        <div 
          className="hidden md:block w-full h-full absolute inset-0"
          style={{
            backgroundImage: `url(${trailerAssets[trailerIndex].image})`,
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
              {trailerIndex + 1} / {trailerAssets.length}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/BG/background_menu.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-white mb-6" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
          MonDefense
        </h1>
        <p className="text-xl text-blue-200 mb-8" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>
          Strategic tower defense gameplay with Monad characters
        </p>
        
        <div className="mb-8">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Defense Mode</CardTitle>
              <CardDescription className="text-blue-200">
                Pure tower defense action with strategic gameplay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={() => setGameMode('defense')}
              >
                Start Defense
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Button variant="ghost" className="text-white hover:text-blue-200">
            How to Play
          </Button>
          <Button variant="ghost" className="text-white hover:text-blue-200">
            Leaderboard
          </Button>
        </div>
        
        {/* Developer Credits */}
        <div className="mt-12 flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
            <img 
              src="/Credits/DR RDM.png" 
              alt="Dr RDM" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center text-white/80 text-sm">
            <p className="font-semibold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>Developer: Dr RDM</p>
            <p className="text-blue-200" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>x.com/@rdmnad</p>
            <p className="mt-1" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}>Special for Monad Mission 7: Leaderboard</p>
            <p className="font-bold text-yellow-300" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>Gmonad!</p>
          </div>
        </div>
      </div>
    </div>
  );
}