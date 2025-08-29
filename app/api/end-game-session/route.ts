import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { SessionData } from "@/types";
import { sessionManager } from "@/lib/session-manager";

export async function POST(request: NextRequest) {
  try {
    // 1. VALIDATE AUTHORIZATION HEADER
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.substring(7);

    // 2. VALIDATE REQUEST BODY
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // 3. VALIDATE AND DECODE JWT TOKEN
    let sessionData: SessionData;
    try {
      sessionData = jwt.verify(token, process.env.JWT_SECRET!) as SessionData;

      // Verify the session ID matches the token
      if (sessionData.sessionId !== sessionId) {
        return NextResponse.json(
          { error: "Session ID mismatch" },
          { status: 401 }
        );
      }
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json(
        { error: "Invalid or expired session token" },
        { status: 401 }
      );
    }

    // 4. VALIDATE SESSION EXISTS AND IS ACTIVE
    const activeSession = sessionManager.getActiveSession(sessionId);
    if (!activeSession) {
      // Session might not be tracked in memory (server restart), but JWT is valid
      console.warn(
        `Session ${sessionId} not found in active sessions, but JWT is valid`
      );
    } else if (activeSession.player !== sessionData.player) {
      return NextResponse.json(
        { error: "Session player mismatch" },
        { status: 401 }
      );
    }

    // 5. CALCULATE SESSION DURATION
    const endTime = Date.now();
    const sessionDuration = endTime - sessionData.startTime;
    const sessionDurationMinutes = Math.round(sessionDuration / 60000);

    // 6. COLLECT FINAL SESSION STATISTICS AND END SESSION
    const currentStats = sessionManager.endSession(sessionId) || {
      totalScore: 0,
      totalTransactions: 0,
      submissionCount: 0,
      startTime: sessionData.startTime,
      endTime: endTime,
    };

    console.log(`Successfully ended game session: ${sessionId}`, {
      player: sessionData.player,
      duration: sessionDurationMinutes,
      totalScore: currentStats.totalScore,
      totalTransactions: currentStats.totalTransactions,
      submissionCount: currentStats.submissionCount,
    });

    // 8. RETURN SUCCESS RESPONSE WITH SESSION SUMMARY
    return NextResponse.json(
      {
        success: true,
        message: "Game session ended successfully",
        sessionSummary: {
          sessionId,
          player: sessionData.player,
          duration: sessionDurationMinutes,
          durationMs: sessionDuration,
          startTime: sessionData.startTime,
          endTime,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error ending game session:", error);

    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === "development";
    const errorMessage =
      isDevelopment && error instanceof Error
        ? error.message
        : "Internal server error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
