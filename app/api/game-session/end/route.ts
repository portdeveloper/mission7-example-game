import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, validateOrigin, createAuthenticatedResponse } from '@/app/lib/auth';
import { endGameSession, getSessionStats } from '@/app/lib/game-session';
import { rateLimit } from '@/app/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Security checks
    if (!validateOrigin(request)) {
      return createAuthenticatedResponse({ error: 'Forbidden: Invalid origin' }, 403);
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(clientIp, { maxRequests: 10, windowMs: 60000 }); // 10 session ends per minute
    
    if (!rateLimitResult.allowed) {
      return createAuthenticatedResponse({
        error: 'Too many session end requests',
        resetTime: rateLimitResult.resetTime
      }, 429);
    }

    const { playerAddress, sessionToken, gameSessionId } = await request.json();

    // Validate session token
    if (!sessionToken || !validateSessionToken(sessionToken, playerAddress)) {
      return createAuthenticatedResponse({ error: 'Unauthorized: Invalid session token' }, 401);
    }

    if (!playerAddress || !gameSessionId) {
      return createAuthenticatedResponse({ 
        error: 'Missing required fields: playerAddress, gameSessionId' 
      }, 400);
    }

    // End the game session
    const result = endGameSession(gameSessionId, playerAddress);
    
    if (!result.valid) {
      return createAuthenticatedResponse({ error: result.error }, 400);
    }

    // Get final session stats
    const stats = getSessionStats(gameSessionId);

    return createAuthenticatedResponse({
      success: true,
      finalScore: result.finalScore,
      stats,
      message: 'Game session ended successfully'
    });

  } catch (error) {
    console.error('Error ending game session:', error);
    return createAuthenticatedResponse(
      { error: 'Failed to end game session' },
      500
    );
  }
}

