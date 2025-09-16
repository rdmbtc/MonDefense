"use client";

import { useQuery } from "@tanstack/react-query";
import { api, apiEndpoints } from "../lib/api";

interface PlayerRankResponse {
  walletAddress: string;
  rank: number | null;
  gameId: number;
  note?: string;
}

export function usePlayerRank(walletAddress: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ["playerRank", walletAddress],
    queryFn: async (): Promise<PlayerRankResponse> => {
      if (!walletAddress) {
        throw new Error("Wallet address is required");
      }
      
      const { data } = await api.get<PlayerRankResponse>(
        `${apiEndpoints.leaderBoard}/rank/${walletAddress}?gameId=8`
      );
      return data;
    },
    enabled: enabled && !!walletAddress,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}