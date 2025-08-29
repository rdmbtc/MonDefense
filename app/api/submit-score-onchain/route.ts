import { NextResponse } from 'next/server';
import { updatePlayerDataOnChain } from '../../../lib/blockchain';
import { GAME_CONFIG } from '../../../lib/game-config';

export async function POST(request: Request) {
  try {
    const { walletAddress, score, transactionCount } = await request.json();

    // Validate required fields
    if (!walletAddress || typeof score !== 'number' || typeof transactionCount !== 'number') {
      return NextResponse.json(
        { 
          error: 'Missing required fields: walletAddress, score, transactionCount',
          success: false 
        },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { 
          error: 'Invalid wallet address format',
          success: false 
        },
        { status: 400 }
      );
    }

    // Validate score and transaction count are positive
    if (score < 0 || transactionCount < 0) {
      return NextResponse.json(
        { 
          error: 'Score and transaction count must be non-negative',
          success: false 
        },
        { status: 400 }
      );
    }

    console.log(`Submitting score on-chain for ${walletAddress}: score=${score}, transactions=${transactionCount}`);

    // Call the blockchain function to update player data
    const result = await updatePlayerDataOnChain(
      walletAddress,
      score,
      transactionCount
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Score submitted successfully on-chain',
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber?.toString(),
        gasUsed: result.gasUsed?.toString(),
        gameId: GAME_CONFIG.BLOCKCHAIN.GAME_ID,
        leaderboardUrl: GAME_CONFIG.BLOCKCHAIN.LEADERBOARD_URL
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to submit score on-chain',
          details: result.error
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in submit-score-onchain API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}