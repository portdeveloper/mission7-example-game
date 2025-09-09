import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, validateOrigin, createAuthenticatedResponse } from '@/app/lib/auth';
import { validateGameAction } from '@/app/lib/game-session';
import { rateLimit } from '@/app/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Security checks
    if (!validateOrigin(request)) {
      return createAuthenticatedResponse({ error: 'Forbidden: Invalid origin' }, 403);
    }

    // Rate limiting - prevent action spam
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(clientIp, { maxRequests: 100, windowMs: 60000 }); // 100 actions per minute
    
    if (!rateLimitResult.allowed) {
      return createAuthenticatedResponse({
        error: 'Too many action requests',
        resetTime: rateLimitResult.resetTime
      }, 429);
    }

    const { playerAddress, sessionToken, gameSessionId, action } = await request.json();

    // Validate session token
    if (!sessionToken || !validateSessionToken(sessionToken, playerAddress)) {
      return createAuthenticatedResponse({ error: 'Unauthorized: Invalid session token' }, 401);
    }

    if (!playerAddress || !gameSessionId || !action) {
      return createAuthenticatedResponse({ 
        error: 'Missing required fields: playerAddress, gameSessionId, action' 
      }, 400);
    }

    // Validate the game action
    const validation = validateGameAction(gameSessionId, playerAddress, action);
    
    if (!validation.valid) {
      return createAuthenticatedResponse({ 
        error: validation.error,
        suspicious: true // Mark as potentially malicious behavior
      }, 400);
    }

    return createAuthenticatedResponse({
      success: true,
      currentScore: validation.session?.score || 0,
      message: 'Action validated successfully'
    });

  } catch (error) {
    console.error('Error validating game action:', error);
    return createAuthenticatedResponse(
      { error: 'Failed to validate game action' },
      500
    );
  }
}

