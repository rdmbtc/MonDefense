import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { sessionManager } from "@/lib/session-manager";

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    const sessionId = randomUUID();
    const startTime = Date.now();

    // Create session using shared session manager
    sessionManager.createSession(sessionId, walletAddress);

    const sessionToken = jwt.sign(
      {
        player: walletAddress,
        sessionId,
        startTime,
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET!,
      { expiresIn: "2h" } // Session expires in 2 hours
    );

    console.log(`Started game session: ${sessionId} for player: ${walletAddress}`);

    return NextResponse.json({
      success: true,
      sessionToken,
      sessionId,
    });
  } catch (error) {
    console.error("Error creating game session:", error);
    return NextResponse.json(
      { error: "Failed to create game session" },
      { status: 500 }
    );
  }
}
