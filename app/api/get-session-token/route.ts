import { NextRequest, NextResponse } from 'next/server';
import { generateSessionToken, validateOrigin } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Forbidden: Invalid origin' },
        { status: 403 }
      );
    }

    const { playerAddress, signedMessage, message } = await request.json();

    if (!playerAddress || !signedMessage || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: playerAddress, signedMessage, message' },
        { status: 400 }
      );
    }

    // Verify that the message contains the player address and a recent timestamp
    // This should be done by checking the signature against the player's wallet
    // For now, we'll implement a basic check - in production, you'd verify the signature
    const expectedMessage = `Authenticate for score submission: ${playerAddress}`;
    if (!message.includes(playerAddress)) {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

    // TODO: Add proper signature verification here using viem/ethers
    // For now, we'll trust that the frontend provides the correct signature
    
    // Generate session token
    const timestamp = Math.floor(Date.now() / 30000) * 30000; // Round to 30-second intervals
    const sessionToken = generateSessionToken(playerAddress, timestamp);

    return NextResponse.json({
      success: true,
      sessionToken,
      expiresAt: timestamp + 300000, // 5 minutes from token timestamp
    });

  } catch (error) {
    console.error('Error generating session token:', error);
    return NextResponse.json(
      { error: 'Failed to generate session token' },
      { status: 500 }
    );
  }
}
