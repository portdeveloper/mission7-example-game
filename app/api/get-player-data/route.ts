import { NextRequest, NextResponse } from 'next/server';
import { getPlayerData, isValidAddress } from '@/app/lib/blockchain';

export async function GET(request: NextRequest) {
  try {
    // Get player address from URL search params
    const { searchParams } = new URL(request.url);
    const playerAddress = searchParams.get('address');

    if (!playerAddress) {
      return NextResponse.json(
        { error: 'Player address is required' },
        { status: 400 }
      );
    }

    if (!isValidAddress(playerAddress)) {
      return NextResponse.json(
        { error: 'Invalid player address format' },
        { status: 400 }
      );
    }

    const playerData = await getPlayerData(playerAddress);

    return NextResponse.json({
      success: true,
      playerAddress,
      totalScore: playerData.totalScore.toString(),
      totalTransactions: playerData.totalTransactions.toString()
    });

  } catch (error) {
    console.error('Error getting player data:', error);
    return NextResponse.json(
      { error: 'Failed to get player data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { playerAddress } = await request.json();

    if (!playerAddress) {
      return NextResponse.json(
        { error: 'Player address is required' },
        { status: 400 }
      );
    }

    if (!isValidAddress(playerAddress)) {
      return NextResponse.json(
        { error: 'Invalid player address format' },
        { status: 400 }
      );
    }

    const playerData = await getPlayerData(playerAddress);

    return NextResponse.json({
      success: true,
      playerAddress,
      totalScore: playerData.totalScore.toString(),
      totalTransactions: playerData.totalTransactions.toString()
    });

  } catch (error) {
    console.error('Error getting player data:', error);
    return NextResponse.json(
      { error: 'Failed to get player data' },
      { status: 500 }
    );
  }
}