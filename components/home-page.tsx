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
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center p-4">
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
      </div>
    </div>
  );
}