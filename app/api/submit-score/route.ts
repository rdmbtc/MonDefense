import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { SessionData } from "@/types";
import { sessionManager } from "@/lib/session-manager";

export async function POST(request: Request) {
  try {
    const { player, scoreAmount, transactionAmount, sessionId } =
      await request.json();

    // 1. VALIDATE INPUT
    if (
      !player ||
      typeof scoreAmount !== "number" ||
      typeof transactionAmount !== "number" ||
      !sessionId
    ) {
      return NextResponse.json(
        { error: "Invalid input parameters" },
        { status: 400 }
      );
    }

    // Validate score and transaction amounts are non-negative
    if (scoreAmount < 0 || transactionAmount < 0) {
      return NextResponse.json(
        { error: "Score and transaction amounts must be non-negative" },
        { status: 400 }
      );
    }

    // 2. VALIDATE SESSION TOKEN
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No valid session token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let sessionData: SessionData;
    try {
      sessionData = jwt.verify(token, process.env.JWT_SECRET!) as SessionData;
      if (
        sessionData.player !== player ||
        sessionData.sessionId !== sessionId
      ) {
        throw new Error("Session mismatch");
      }
    } catch (err) {
      console.error("JWT verification failed:", err);
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    // 3. UPDATE SESSION TRACKING
    sessionManager.updateSessionActivity(sessionId);
    
    // Update session statistics
    const currentStats = sessionManager.updateSessionStats(
      sessionId,
      scoreAmount,
      transactionAmount
    );

    // 4. PROCESS SCORE SUBMISSION
    console.log("Processing score submission with data:", {
      player,
      scoreAmount,
      transactionAmount,
      sessionId,
      sessionData,
      updatedStats: currentStats
    });

    // Generate a mock transaction hash for consistency
    const mockTransactionHash = `0x${Math.random().toString(16).substring(2, 66).padStart(64, '0')}`;

    console.log("Successfully processed score submission:", {
      player,
      scoreAmount,
      transactionAmount,
      transactionHash: mockTransactionHash,
      sessionId,
      totalSessionScore: currentStats.totalScore,
      totalSubmissions: currentStats.submissionCount,
    });

    return NextResponse.json({
      success: true,
      transactionHash: mockTransactionHash,
      player,
      scoreAmount,
      transactionAmount,
    });
  } catch (error: unknown) {
    console.error("Unexpected error in submit-score endpoint:", error);

    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === "development";
    const errorMessage =
      isDevelopment && error instanceof Error
        ? error.message
        : "Failed to process score submission";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
