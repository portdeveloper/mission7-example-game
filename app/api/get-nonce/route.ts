import { NextRequest, NextResponse } from 'next/server';
import { createNonce, validateOrigin } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Forbidden: Invalid origin' },
        { status: 403 }
      );
    }

    const { playerAddress } = await request.json();

    if (!playerAddress) {
      return NextResponse.json(
        { error: 'Player address is required' },
        { status: 400 }
      );
    }

    // Generate a fresh nonce
    const nonce = createNonce();

    return NextResponse.json({
      success: true,
      nonce,
      message: `Authenticate wallet for gaming session.\nNonce: ${nonce}\nAddress: ${playerAddress}`,
      expiresIn: 300000, // 5 minutes
    });

  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}

