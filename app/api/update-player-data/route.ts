import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http } from 'viem';
import { monadTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESS, CONTRACT_ABI, isValidAddress } from '@/app/lib/blockchain';
import { validateSessionToken, validateOrigin, createAuthenticatedResponse } from '@/app/lib/auth';
import { rateLimit } from '@/app/lib/rate-limiter';
import { generateRequestId, isDuplicateRequest, markRequestProcessing, markRequestComplete } from '@/app/lib/request-deduplication';
import { getGameSession } from '@/app/lib/game-session';

export async function POST(request: NextRequest) {
  try {
    // Security checks - Origin validation first
    if (!validateOrigin(request)) {
      return createAuthenticatedResponse({ error: 'Forbidden: Invalid origin' }, 403);
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(clientIp, { maxRequests: 10, windowMs: 60000 }); // 10 requests per minute
    
    if (!rateLimitResult.allowed) {
      return createAuthenticatedResponse({
        error: 'Too many requests',
        resetTime: rateLimitResult.resetTime
      }, 429);
    }

    // Parse request body
    const { playerAddress, gameSessionId, sessionToken } = await request.json();

    // Session token authentication - verify the user controls the wallet
    if (!sessionToken || !validateSessionToken(sessionToken, playerAddress)) {
      return createAuthenticatedResponse({ error: 'Unauthorized: Invalid or expired session token' }, 401);
    }

    // Validate input
    if (!playerAddress || !gameSessionId) {
      return createAuthenticatedResponse(
        { error: 'Missing required fields: playerAddress, gameSessionId' },
        400
      );
    }

    // Validate player address format
    if (!isValidAddress(playerAddress)) {
      return createAuthenticatedResponse(
        { error: 'Invalid player address format' },
        400
      );
    }

    // Get the validated game session
    const gameSession = getGameSession(gameSessionId);
    
    if (!gameSession) {
      return createAuthenticatedResponse(
        { error: 'Invalid game session ID' },
        400
      );
    }
    
    if (gameSession.playerAddress !== playerAddress) {
      return createAuthenticatedResponse(
        { error: 'Game session belongs to different player' },
        403
      );
    }
    
    if (gameSession.isActive) {
      return createAuthenticatedResponse(
        { error: 'Game session is still active. End the session first.' },
        400
      );
    }
    
    // Use server-validated scores from the game session
    const scoreAmount = gameSession.score;
    const transactionAmount = 1; // One transaction per completed game

    // Request deduplication based on game session ID
    const requestId = generateRequestId(playerAddress, scoreAmount, gameSessionId);
    if (isDuplicateRequest(requestId)) {
      return createAuthenticatedResponse(
        { error: 'Duplicate request detected. Please wait before retrying.' },
        409
      );
    }

    markRequestProcessing(requestId);

    // Get private key from environment variable
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      console.error('WALLET_PRIVATE_KEY environment variable not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create account from private key
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    // Create wallet client
    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http()
    });

    // Call the updatePlayerData function
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'updatePlayerData',
      args: [
        playerAddress as `0x${string}`,
        BigInt(scoreAmount),
        BigInt(transactionAmount)
      ]
    });

    markRequestComplete(requestId);

    return createAuthenticatedResponse({
      success: true,
      transactionHash: hash,
      message: 'Player data updated successfully'
    });

  } catch (error) {
    console.error('Error updating player data:', error);
    
    // Handle specific viem errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        return createAuthenticatedResponse(
          { error: 'Insufficient funds to complete transaction' },
          400
        );
      }
      if (error.message.includes('execution reverted')) {
        return createAuthenticatedResponse(
          { error: 'Contract execution failed - check if wallet has GAME_ROLE permission' },
          400
        );
      }
      if (error.message.includes('AccessControlUnauthorizedAccount')) {
        return createAuthenticatedResponse(
          { error: 'Unauthorized: Wallet does not have GAME_ROLE permission' },
          403
        );
      }
    }

    return createAuthenticatedResponse(
      { error: 'Failed to update player data' },
      500
    );
  }
}