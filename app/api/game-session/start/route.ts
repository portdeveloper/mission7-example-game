import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, validateOrigin, createAuthenticatedResponse } from '@/app/lib/auth';
import { createGameSession } from '@/app/lib/game-session';
import { rateLimit } from '@/app/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Security checks
    if (!validateOrigin(request)) {
      return createAuthenticatedResponse({ error: 'Forbidden: Invalid origin' }, 403);
    }

    // Rate limiting - prevent session spam
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(clientIp, { maxRequests: 5, windowMs: 60000 }); // 5 sessions per minute
    
    if (!rateLimitResult.allowed) {
      return createAuthenticatedResponse({
        error: 'Too many session requests',
        resetTime: rateLimitResult.resetTime
      }, 429);
    }

    const { playerAddress, sessionToken } = await request.json();

    // Validate session token
    if (!sessionToken || !validateSessionToken(sessionToken, playerAddress)) {
      return createAuthenticatedResponse({ error: 'Unauthorized: Invalid session token' }, 401);
    }

    if (!playerAddress) {
      return createAuthenticatedResponse({ error: 'Player address is required' }, 400);
    }

    // Create new game session
    const gameSessionId = createGameSession(playerAddress);

    return createAuthenticatedResponse({
      success: true,
      gameSessionId,
      message: 'Game session started successfully'
    });

  } catch (error) {
    console.error('Error starting game session:', error);
    return createAuthenticatedResponse(
      { error: 'Failed to start game session' },
      500
    );
  }
}

