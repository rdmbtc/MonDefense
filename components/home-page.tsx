"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';

// Dynamically import the defense game component
const DefenseGame = dynamic(() => import('./defense-game'), {
  ssr: false,
  loading: () => <div className="text-white text-center">Loading Defense Game...</div>
});

export default function HomePage() {
  const [gameMode, setGameMode] = useState<'home' | 'defense'>('home');

  if (gameMode === 'defense') {
    return <DefenseGame onBack={() => setGameMode('home')} />;
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
        <h1 className="text-6xl font-bold text-white mb-6">
          MonDefense
        </h1>
        <p className="text-xl text-blue-200 mb-8">
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
            <p className="font-semibold">Developer: Dr RDM</p>
            <p className="text-blue-200">x.com/@rdmnad</p>
            <p className="mt-1">Special for Monad Mission 7: Leaderboard</p>
            <p className="font-bold text-yellow-300">Gmonad!</p>
          </div>
        </div>
      </div>
    </div>
  );
}