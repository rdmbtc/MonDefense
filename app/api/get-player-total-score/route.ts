import { NextResponse } from "next/server";
import { getPlayerData, isValidAddress } from "../../../lib/blockchain";

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
    const playerData = await getPlayerData(walletAddress);

    return NextResponse.json(
      { 
        totalScore: playerData.totalScore.toString(),
        totalTransactions: playerData.totalTransactions.toString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching player data:', error);
    return NextResponse.json(
      {
        error: "Failed to fetch total score",
        errorMessage: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
