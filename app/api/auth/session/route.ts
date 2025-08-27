import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { verifyMessage } from 'viem';

// Configure route as dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory session store (use Redis in production)
const sessionStore = new Map<string, {
  playerAddress: string;
  expiresAt: number;
  createdAt: number;
}>();

// Session configuration
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

// Cleanup expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessionStore.entries()) {
    if (now > session.expiresAt) {
      sessionStore.delete(token);
    }
  }
}, CLEANUP_INTERVAL);

// Generate a secure session token
function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// Create a message for wallet signature
function createSignatureMessage(playerAddress: string, nonce: string): string {
  return `MonDefense Game Authentication\n\nAddress: ${playerAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
}

// Validate session token
export function validateSessionToken(token: string): { valid: boolean; playerAddress?: string } {
  const session = sessionStore.get(token);
  
  if (!session) {
    return { valid: false };
  }
  
  if (Date.now() > session.expiresAt) {
    sessionStore.delete(token);
    return { valid: false };
  }
  
  return { valid: true, playerAddress: session.playerAddress };
}

// POST: Create a new session token
export async function POST(request: NextRequest) {
  try {
    const { playerAddress, signature, nonce } = await request.json();
    
    // Input validation
    if (!playerAddress || typeof playerAddress !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid player address' },
        { status: 400 }
      );
    }
    
    if (!signature || typeof signature !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    if (!nonce || typeof nonce !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid nonce' },
        { status: 400 }
      );
    }
    
    // Create the message that should have been signed
    const message = createSignatureMessage(playerAddress, nonce);
    
    // Verify the signature
    try {
      const isValid = await verifyMessage({
        address: playerAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`
      });
      
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } catch (verifyError) {
      console.error('Signature verification error:', verifyError);
      return NextResponse.json(
        { success: false, error: 'Signature verification failed' },
        { status: 401 }
      );
    }
    
    // Generate session token
    const sessionToken = generateSessionToken();
    const now = Date.now();
    
    // Store session
    sessionStore.set(sessionToken, {
      playerAddress,
      expiresAt: now + SESSION_DURATION,
      createdAt: now
    });
    
    return NextResponse.json({
      success: true,
      sessionToken,
      expiresAt: now + SESSION_DURATION,
      message: 'Session created successfully'
    });
    
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Get a nonce for signature
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerAddress = searchParams.get('address');
    
    if (!playerAddress) {
      return NextResponse.json(
        { success: false, error: 'Player address required' },
        { status: 400 }
      );
    }
    
    // Generate a nonce
    const nonce = randomBytes(16).toString('hex');
    const message = createSignatureMessage(playerAddress, nonce);
    
    return NextResponse.json({
      success: true,
      nonce,
      message,
      instructions: 'Sign this message with your wallet to authenticate'
    });
    
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Invalidate session token
export async function DELETE(request: NextRequest) {
  try {
    const { sessionToken } = await request.json();
    
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Session token required' },
        { status: 400 }
      );
    }
    
    // Remove session
    const deleted = sessionStore.delete(sessionToken);
    
    return NextResponse.json({
      success: true,
      message: deleted ? 'Session invalidated' : 'Session not found'
    });
    
  } catch (error) {
    console.error('Error invalidating session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}