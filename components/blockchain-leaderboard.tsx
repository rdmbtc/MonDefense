"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGameScoreContract } from '@/hooks/use-game-score-contract';
import { Trophy, Medal, Award, Users, GamepadIcon, Activity } from 'lucide-react';

interface BlockchainLeaderboardProps {
  className?: string;
}

export default function BlockchainLeaderboard({ className }: BlockchainLeaderboardProps) {
  const {
    isLoading,
    leaderboard,
    globalStats,
    fetchLeaderboard,
    fetchGlobalStats
  } = useGameScoreContract();
  
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchLeaderboard(10),
        fetchGlobalStats()
      ]);
    };
    
    loadData();
  }, [fetchLeaderboard, fetchGlobalStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchLeaderboard(10),
        fetchGlobalStats()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">#{index + 1}</span>;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatScore = (score: string) => {
    return parseInt(score).toLocaleString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Global Stats */}
      {globalStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Players</p>
                  <p className="text-2xl font-bold text-blue-600">{globalStats.totalPlayers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <GamepadIcon className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Games</p>
                  <p className="text-2xl font-bold text-green-600">{globalStats.totalGames}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                  <p className="text-2xl font-bold text-purple-600">{globalStats.totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Blockchain Leaderboard
          </CardTitle>
          <Button
            onClick={handleRefresh}
            disabled={isLoading || refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {(isLoading || refreshing) ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            ) : (
              <Activity className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && leaderboard.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              <span className="ml-2 text-gray-600">Loading leaderboard...</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No scores recorded yet.</p>
              <p className="text-sm">Be the first to submit your score to the blockchain!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={`${entry.address}-${index}`}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    index < 3
                      ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700'
                      : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {getRankIcon(index)}
                    <div>
                      <p className="font-mono text-sm font-medium">
                        {formatAddress(entry.address)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Rank #{index + 1}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {formatScore(entry.score)}
                    </p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {leaderboard.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                Scores are permanently recorded on the Monad blockchain
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}