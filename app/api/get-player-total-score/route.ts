import { NextResponse } from "next/server";
import { getPlayerData, isValidAddress } from "../../../lib/blockchain";

// Simple in-memory cache to reduce RPC calls
interface CacheEntry {
  data: any;
  timestamp: number;
}

const playerDataCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds cache

function getCachedPlayerData(walletAddress: string) {
  const cached = playerDataCache.get(walletAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedPlayerData(walletAddress: string, data: any) {
  playerDataCache.set(walletAddress, {
    data,
    timestamp: Date.now()
  });
  
  // Clean up old entries to prevent memory leaks
  if (playerDataCache.size > 100) {
    const oldestKey = playerDataCache.keys().next().value;
    if (oldestKey !== undefined) {
      playerDataCache.delete(oldestKey);
    }
  }
}

export async function POST(request: Request) {
  const { walletAddress } = await request.json();

  if (!walletAddress) {
    return NextResponse.json(
      { error: "Invalid or missing wallet address" },
      { status: 400 }
    );
  }

  if (!isValidAddress(walletAddress)) {
    return NextResponse.json(
      { error: "Invalid wallet address format" },
      { status: 400 }
    );
  }

  try {
    // Check cache first
    const cachedData = getCachedPlayerData(walletAddress);
    if (cachedData) {
      return NextResponse.json(cachedData, { status: 200 });
    }

    const playerData = await getPlayerData(walletAddress);
    
    const responseData = {
      totalScore: parseInt(playerData.totalScore.toString()),
      bestScore: playerData.totalScore.toString(),
      gamesPlayed: parseInt(playerData.totalTransactions.toString())
    };
    
    // Cache the response
    setCachedPlayerData(walletAddress, responseData);

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Error fetching player data:', error);
    
    // Check if it's a rate limit error
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('429') || errorMessage.includes('request limit reached')) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          errorMessage: "Too many requests to blockchain RPC. Please try again later.",
          retryAfter: 60 // Suggest retry after 60 seconds
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Failed to fetch total score",
        errorMessage: errorMessage,
      },
      { status: 500 }
    );
  }
}
