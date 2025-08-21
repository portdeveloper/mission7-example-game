import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http } from 'viem';
import { monadTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESS, CONTRACT_ABI, isValidAddress } from '@/app/lib/blockchain';
import { validateSessionToken, validateOrigin, createAuthenticatedResponse } from '@/app/lib/auth';
import { rateLimit } from '@/app/lib/rate-limiter';
import { generateRequestId, isDuplicateRequest, markRequestProcessing, markRequestComplete } from '@/app/lib/request-deduplication';

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
    const { playerAddress, scoreAmount, transactionAmount, sessionToken } = await request.json();

    // Session token authentication - verify the user controls the wallet
    if (!sessionToken || !validateSessionToken(sessionToken, playerAddress)) {
      return createAuthenticatedResponse({ error: 'Unauthorized: Invalid or expired session token' }, 401);
    }

    // Validate input
    if (!playerAddress || scoreAmount === undefined || transactionAmount === undefined) {
      return createAuthenticatedResponse(
        { error: 'Missing required fields: playerAddress, scoreAmount, transactionAmount' },
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

    // Validate that scoreAmount and transactionAmount are positive numbers
    if (scoreAmount < 0 || transactionAmount < 0) {
      return createAuthenticatedResponse(
        { error: 'Score and transaction amounts must be non-negative' },
        400
      );
    }

    // Maximum limits to prevent abuse - made more restrictive
    const MAX_SCORE_PER_REQUEST = 1000; // Reduced from 10000
    const MAX_TRANSACTIONS_PER_REQUEST = 10; // Reduced from 100
    
    // Additional validation: reasonable score ranges
    const MIN_SCORE_PER_REQUEST = 1;
    const MAX_SCORE_PER_TRANSACTION = 100; // Max 100 points per transaction

    if (scoreAmount > MAX_SCORE_PER_REQUEST || transactionAmount > MAX_TRANSACTIONS_PER_REQUEST) {
      return createAuthenticatedResponse(
        { error: `Amounts too large. Max score: ${MAX_SCORE_PER_REQUEST}, Max transactions: ${MAX_TRANSACTIONS_PER_REQUEST}` },
        400
      );
    }

    if (scoreAmount < MIN_SCORE_PER_REQUEST && scoreAmount !== 0) {
      return createAuthenticatedResponse(
        { error: `Score amount too small. Minimum: ${MIN_SCORE_PER_REQUEST}` },
        400
      );
    }

    // Validate score-to-transaction ratio to prevent unrealistic scores
    if (transactionAmount > 0 && (scoreAmount / transactionAmount) > MAX_SCORE_PER_TRANSACTION) {
      return createAuthenticatedResponse(
        { error: `Score per transaction too high. Maximum: ${MAX_SCORE_PER_TRANSACTION} points per transaction` },
        400
      );
    }

    // Request deduplication
    const requestId = generateRequestId(playerAddress, scoreAmount, transactionAmount);
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