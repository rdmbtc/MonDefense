import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, parseEther, formatEther, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';
import { GAME_SCORE_CONTRACT_ADDRESS, GAME_SCORE_ABI } from '../../../lib/game-score-contract';
import { validateSessionToken } from '../auth/session/route';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const requestStore = new Map<string, number>();
const requestDeduplication = new Map<string, { timestamp: number; result: any }>();

// Get private key from environment
const GAME_WALLET_PRIVATE_KEY = process.env.GAME_WALLET_PRIVATE_KEY;

if (!GAME_WALLET_PRIVATE_KEY) {
  throw new Error('GAME_WALLET_PRIVATE_KEY environment variable is required');
}

// Create wallet account from private key
const gameWalletAccount = privateKeyToAccount(GAME_WALLET_PRIVATE_KEY as `0x${string}`);

// Create public client for reading contract
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http('https://testnet-rpc.monad.xyz')
});

// Create wallet client for transactions
const walletClient = createWalletClient({
  account: gameWalletAccount,
  chain: monadTestnet,
  transport: http('https://testnet-rpc.monad.xyz')
});

// Note: GAME_ROLE permission check removed as the contract ABI doesn't support hasRole function
// The game wallet should be properly configured with necessary permissions

// Security configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const MAX_SCORE_PER_REQUEST = 1000000;
const MAX_TRANSACTIONS_PER_REQUEST = 1000;
const MAX_SCORE_TO_TRANSACTION_RATIO = 1000;

interface UpdatePlayerDataRequest {
  playerAddress: string;
  scoreAmount: number;
  transactionAmount: number;
  sessionToken?: string;
}

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(identifier);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

function generateRequestId(playerAddress: string, scoreAmount: number, transactionAmount: number): string {
  return `${playerAddress}-${scoreAmount}-${transactionAmount}-${Math.floor(Date.now() / 1000)}`;
}

function isDuplicateRequest(requestId: string): boolean {
  const now = Date.now();
  const requestTime = requestStore.get(requestId);
  
  if (requestTime && (now - requestTime) < 30000) { // 30 second window
    return true;
  }
  
  requestStore.set(requestId, now);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Security: Check origin
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'https://localhost:3000'
    ].filter(Boolean);
    
    if (origin && !allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { error: 'Forbidden origin' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: UpdatePlayerDataRequest = await request.json();
    const { playerAddress, scoreAmount, transactionAmount, sessionToken } = body;

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Input validation
    if (!playerAddress || !isValidAddress(playerAddress)) {
      return NextResponse.json(
        { error: 'Invalid player address' },
        { status: 400 }
      );
    }

    if (typeof scoreAmount !== 'number' || scoreAmount < 0 || scoreAmount > MAX_SCORE_PER_REQUEST) {
      return NextResponse.json(
        { error: `Invalid score amount. Must be between 0 and ${MAX_SCORE_PER_REQUEST}` },
        { status: 400 }
      );
    }

    if (typeof transactionAmount !== 'number' || transactionAmount < 0 || transactionAmount > MAX_TRANSACTIONS_PER_REQUEST) {
      return NextResponse.json(
        { error: `Invalid transaction amount. Must be between 0 and ${MAX_TRANSACTIONS_PER_REQUEST}` },
        { status: 400 }
      );
    }

    // Validate score to transaction ratio
    if (transactionAmount > 0 && (scoreAmount / transactionAmount) > MAX_SCORE_TO_TRANSACTION_RATIO) {
      return NextResponse.json(
        { error: 'Invalid score to transaction ratio' },
        { status: 400 }
      );
    }

    // Validate session token
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Session token required' },
        { status: 401 }
      );
    }

    const sessionValidation = validateSessionToken(sessionToken);
     if (!sessionValidation.valid) {
       return NextResponse.json(
         { success: false, error: 'Invalid session token' },
         { status: 401 }
       );
     }
     
     // Verify that the session belongs to the requesting player
     if (sessionValidation.playerAddress !== playerAddress) {
       return NextResponse.json(
         { success: false, error: 'Session token does not match player address' },
         { status: 403 }
       );
     }

    // Submit transaction to blockchain
    try {
      const txHash = await walletClient.writeContract({
         address: GAME_SCORE_CONTRACT_ADDRESS as `0x${string}`,
         abi: GAME_SCORE_ABI,
         functionName: 'updatePlayerData',
         args: [
           playerAddress as `0x${string}`,
           BigInt(scoreAmount),
           BigInt(transactionAmount)
         ]
       });

      const result = {
         success: true,
         transactionHash: txHash,
         message: 'Score submitted successfully'
       };

       // Store result for deduplication
       const requestKey = generateRequestId(playerAddress, scoreAmount, transactionAmount);
       const now = Date.now();
       requestDeduplication.set(requestKey, {
         timestamp: now,
         result
       });
 
       return NextResponse.json(result);

    } catch (contractError: any) {
      console.error('Contract interaction error:', contractError);
      
      // Handle specific contract errors
      if (contractError.message?.includes('AccessControl')) {
        return NextResponse.json(
          { success: false, error: 'Insufficient contract permissions' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to submit transaction to blockchain' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in update-player-data API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}