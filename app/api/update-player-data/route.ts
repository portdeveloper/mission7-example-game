import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http } from 'viem';
import { monadTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESS, CONTRACT_ABI, isValidAddress } from '@/app/lib/blockchain';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { playerAddress, scoreAmount, transactionAmount } = await request.json();

    // Validate input
    if (!playerAddress || scoreAmount === undefined || transactionAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: playerAddress, scoreAmount, transactionAmount' },
        { status: 400 }
      );
    }

    // Validate player address format
    if (!isValidAddress(playerAddress)) {
      return NextResponse.json(
        { error: 'Invalid player address format' },
        { status: 400 }
      );
    }

    // Validate that scoreAmount and transactionAmount are positive numbers
    if (scoreAmount < 0 || transactionAmount < 0) {
      return NextResponse.json(
        { error: 'Score and transaction amounts must be non-negative' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      message: 'Player data updated successfully'
    });

  } catch (error) {
    console.error('Error updating player data:', error);
    
    // Handle specific viem errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        return NextResponse.json(
          { error: 'Insufficient funds to complete transaction' },
          { status: 400 }
        );
      }
      if (error.message.includes('execution reverted')) {
        return NextResponse.json(
          { error: 'Contract execution failed - check if wallet has GAME_ROLE permission' },
          { status: 400 }
        );
      }
      if (error.message.includes('AccessControlUnauthorizedAccount')) {
        return NextResponse.json(
          { error: 'Unauthorized: Wallet does not have GAME_ROLE permission' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update player data' },
      { status: 500 }
    );
  }
}