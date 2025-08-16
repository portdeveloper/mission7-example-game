import { NextRequest, NextResponse } from 'next/server';
import { getPlayerDataPerGame, isValidAddress } from '@/app/lib/blockchain';

export async function GET(request: NextRequest) {
  try {
    // Get parameters from URL search params
    const { searchParams } = new URL(request.url);
    const playerAddress = searchParams.get('playerAddress');
    const gameAddress = searchParams.get('gameAddress');

    if (!playerAddress || !gameAddress) {
      return NextResponse.json(
        { error: 'Both playerAddress and gameAddress are required' },
        { status: 400 }
      );
    }

    if (!isValidAddress(playerAddress) || !isValidAddress(gameAddress)) {
      return NextResponse.json(
        { error: 'Invalid player or game address format' },
        { status: 400 }
      );
    }

    const playerData = await getPlayerDataPerGame(playerAddress, gameAddress);

    return NextResponse.json({
      success: true,
      playerAddress,
      gameAddress,
      score: playerData.score.toString(),
      transactions: playerData.transactions.toString()
    });

  } catch (error) {
    console.error('Error getting player data per game:', error);
    return NextResponse.json(
      { error: 'Failed to get player data per game' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { playerAddress, gameAddress } = await request.json();

    if (!playerAddress || !gameAddress) {
      return NextResponse.json(
        { error: 'Both playerAddress and gameAddress are required' },
        { status: 400 }
      );
    }

    if (!isValidAddress(playerAddress) || !isValidAddress(gameAddress)) {
      return NextResponse.json(
        { error: 'Invalid player or game address format' },
        { status: 400 }
      );
    }

    const playerData = await getPlayerDataPerGame(playerAddress, gameAddress);

    return NextResponse.json({
      success: true,
      playerAddress,
      gameAddress,
      score: playerData.score.toString(),
      transactions: playerData.transactions.toString()
    });

  } catch (error) {
    console.error('Error getting player data per game:', error);
    return NextResponse.json(
      { error: 'Failed to get player data per game' },
      { status: 500 }
    );
  }
}