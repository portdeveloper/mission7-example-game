// Client-side API helpers for score submission

interface ScoreSubmissionResponse {
  success: boolean;
  transactionHash?: string;
  message?: string;
  error?: string;
}

interface PlayerDataResponse {
  success: boolean;
  playerAddress: string;
  totalScore: string;
  totalTransactions: string;
  error?: string;
}

interface PlayerDataPerGameResponse {
  success: boolean;
  playerAddress: string;
  gameAddress: string;
  score: string;
  transactions: string;
  error?: string;
}

// Submit player score and transaction data to the contract
export async function submitPlayerScore(
  playerAddress: string,
  scoreAmount: number,
  transactionAmount: number = 1
): Promise<ScoreSubmissionResponse> {
  try {
    const response = await fetch('/api/update-player-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerAddress,
        scoreAmount,
        transactionAmount,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting score:', error);
    return {
      success: false,
      error: 'Failed to submit score',
    };
  }
}

// Get player's total data across all games
export async function getPlayerTotalData(playerAddress: string): Promise<PlayerDataResponse | null> {
  try {
    const response = await fetch(`/api/get-player-data?address=${encodeURIComponent(playerAddress)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting player data:', error);
    return null;
  }
}

// Get player's data for a specific game
export async function getPlayerGameData(
  playerAddress: string,
  gameAddress: string
): Promise<PlayerDataPerGameResponse | null> {
  try {
    const response = await fetch(
      `/api/get-player-data-per-game?playerAddress=${encodeURIComponent(playerAddress)}&gameAddress=${encodeURIComponent(gameAddress)}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting player game data:', error);
    return null;
  }
}

// Helper to batch score submissions (avoid spamming the blockchain)
export class ScoreSubmissionManager {
  private playerAddress: string;
  private pendingScore: number = 0;
  private pendingTransactions: number = 0;
  private submitTimeout: NodeJS.Timeout | null = null;
  private readonly submitDelay = 5000; // 5 seconds delay before submission

  constructor(playerAddress: string) {
    this.playerAddress = playerAddress;
  }

  // Add score points (will be batched and submitted after delay)
  addScore(points: number) {
    this.pendingScore += points;
    this.scheduleSubmission();
  }

  // Add transaction count (will be batched and submitted after delay)
  addTransaction(count: number = 1) {
    this.pendingTransactions += count;
    this.scheduleSubmission();
  }

  // Submit immediately (bypasses batching)
  async submitImmediately(): Promise<ScoreSubmissionResponse> {
    if (this.submitTimeout) {
      clearTimeout(this.submitTimeout);
      this.submitTimeout = null;
    }

    const score = this.pendingScore;
    const transactions = this.pendingTransactions;

    // Reset pending amounts
    this.pendingScore = 0;
    this.pendingTransactions = 0;

    if (score === 0 && transactions === 0) {
      return { success: true, message: 'No pending data to submit' };
    }

    return submitPlayerScore(this.playerAddress, score, transactions);
  }

  // Schedule a delayed submission (batches multiple updates)
  private scheduleSubmission() {
    if (this.submitTimeout) {
      clearTimeout(this.submitTimeout);
    }

    this.submitTimeout = setTimeout(async () => {
      if (this.pendingScore > 0 || this.pendingTransactions > 0) {
        const result = await this.submitImmediately();
        if (!result.success) {
          console.error('Failed to submit score:', result.error);
        } else {
          console.log('Score submitted successfully:', result.transactionHash);
        }
      }
    }, this.submitDelay);
  }

  // Get current pending amounts
  getPendingData() {
    return {
      score: this.pendingScore,
      transactions: this.pendingTransactions,
    };
  }

  // Clean up timeouts
  destroy() {
    if (this.submitTimeout) {
      clearTimeout(this.submitTimeout);
      this.submitTimeout = null;
    }
  }
}