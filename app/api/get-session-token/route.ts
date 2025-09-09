import { NextRequest, NextResponse } from 'next/server';
import { generateSessionToken, validateOrigin, verifySignatureAndNonce } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Forbidden: Invalid origin' },
        { status: 403 }
      );
    }

    const { playerAddress, signature, nonce } = await request.json();

    if (!playerAddress || !signature || !nonce) {
      return NextResponse.json(
        { error: 'Missing required fields: playerAddress, signature, nonce' },
        { status: 400 }
      );
    }

    // Verify the signature and nonce
    const isValidSignature = await verifySignatureAndNonce(playerAddress, signature, nonce);
    
    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid signature or expired/used nonce' },
        { status: 401 }
      );
    }
    
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
