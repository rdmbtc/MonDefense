'use client';

import React from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award } from 'lucide-react';

const Leaderboard: React.FC = () => {
  const { data: leaderboardData, isLoading, error } = useLeaderboard(1);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Failed to load leaderboard</p>
        <p className="text-sm text-gray-400 mt-2">Please try again later</p>
      </div>
    );
  }

  if (!leaderboardData?.data?.data || leaderboardData.data.data.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-400">No scores yet</p>
        <p className="text-sm text-gray-500 mt-2">Be the first to set a high score!</p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <div className="h-6 w-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white">
            {rank}
          </div>
        );
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 2:
        return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
      case 3:
        return 'bg-amber-600/20 text-amber-400 border-amber-600/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-3">
      {leaderboardData.data.data.map((player: any, index: number) => {
        const rank = index + 1;
        return (
          <Card key={player.walletAddress} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getRankIcon(rank)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-white truncate">
                        {player.username || `Player ${player.walletAddress.slice(0, 6)}...${player.walletAddress.slice(-4)}`}
                      </p>
                      <Badge className={`text-xs ${getRankBadgeColor(rank)}`}>
                        #{rank}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {player.walletAddress.slice(0, 8)}...{player.walletAddress.slice(-6)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">
                    {player.score.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    Games: {player.rank}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Leaderboard;