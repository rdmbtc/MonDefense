"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-white mb-6">
          MonDefense
        </h1>
        <p className="text-xl text-blue-200 mb-8">
          Defend your farm with strategic tower defense gameplay
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Farm Mode</CardTitle>
              <CardDescription className="text-blue-200">
                Build and manage your farm while defending against waves of enemies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                Start Farming
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Defense Mode</CardTitle>
              <CardDescription className="text-blue-200">
                Pure tower defense action with strategic gameplay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" variant="outline">
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