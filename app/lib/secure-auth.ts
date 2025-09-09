// Utility for secure wallet authentication with session management

import { getNonce, getSessionToken, startGameSession, submitGameAction, endGameSession, submitGameSession } from './score-api';

interface AuthSession {
  playerAddress: string;
  sessionToken: string;
  gameSessionId?: string;
  expiresAt: number;
}

export class SecureGameAuth {
  private session: AuthSession | null = null;

  // Step 1: Authenticate wallet with signature (one-time per session)
  async authenticateWallet(
    playerAddress: string,
    signMessage: (message: string) => Promise<string>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get nonce for signature
      const nonceData = await getNonce(playerAddress);
      if (!nonceData) {
        return { success: false, error: 'Failed to get authentication nonce' };
      }

      // Sign the message with wallet
      const signature = await signMessage(nonceData.message);

      // Get session token
      const sessionToken = await getSessionToken(playerAddress, signature, nonceData.nonce);
      if (!sessionToken) {
        return { success: false, error: 'Failed to authenticate signature' };
      }

      // Store session
      this.session = {
        playerAddress,
        sessionToken,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      };

      return { success: true };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  // Step 2: Start a secure game session
  async startGame(): Promise<{ success: boolean; gameSessionId?: string; error?: string }> {
    if (!this.session || Date.now() > this.session.expiresAt) {
      return { success: false, error: 'Authentication expired. Please authenticate again.' };
    }

    try {
      const result = await startGameSession(this.session.playerAddress, this.session.sessionToken);
      
      if (result.success && result.gameSessionId) {
        this.session.gameSessionId = result.gameSessionId;
      }

      return result;
    } catch (error) {
      console.error('Game start error:', error);
      return { success: false, error: 'Failed to start game' };
    }
  }

  // Step 3: Submit game actions for server validation
  async submitAction(
    actionType: 'shot_fired' | 'enemy_killed',
    actionData?: Record<string, unknown>
  ): Promise<{ success: boolean; currentScore?: number; error?: string }> {
    if (!this.session || !this.session.gameSessionId) {
      return { success: false, error: 'No active game session' };
    }

    try {
      return await submitGameAction(
        this.session.playerAddress,
        this.session.gameSessionId,
        this.session.sessionToken,
        { type: actionType, data: actionData }
      );
    } catch (error) {
      console.error('Action submission error:', error);
      return { success: false, error: 'Failed to submit action' };
    }
  }

  // Step 4: End game and get final validated score
  async endGame(): Promise<{ success: boolean; finalScore?: number; stats?: unknown; error?: string }> {
    if (!this.session || !this.session.gameSessionId) {
      return { success: false, error: 'No active game session' };
    }

    try {
      const result = await endGameSession(
        this.session.playerAddress,
        this.session.gameSessionId,
        this.session.sessionToken
      );

      // Clear game session ID after ending
      if (result.success) {
        this.session.gameSessionId = undefined;
      }

      return result;
    } catch (error) {
      console.error('Game end error:', error);
      return { success: false, error: 'Failed to end game' };
    }
  }

  // Step 5: Submit final score to blockchain
  async submitToBlockchain(): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    if (!this.session) {
      return { success: false, error: 'No active session' };
    }

    if (this.session.gameSessionId) {
      return { success: false, error: 'Game session still active. End the game first.' };
    }

    try {
      // This would submit the last completed game session
      // For now, we'll need the game session ID from the last ended game
      // In a production system, you'd track this properly
      return { success: false, error: 'Implementation pending - need game session tracking' };
    } catch (error) {
      console.error('Blockchain submission error:', error);
      return { success: false, error: 'Failed to submit to blockchain' };
    }
  }

  // Get current session status
  getSessionStatus(): {
    authenticated: boolean;
    gameActive: boolean;
    playerAddress?: string;
    expiresAt?: number;
  } {
    if (!this.session) {
      return { authenticated: false, gameActive: false };
    }

    const isExpired = Date.now() > this.session.expiresAt;
    
    return {
      authenticated: !isExpired,
      gameActive: !!this.session.gameSessionId && !isExpired,
      playerAddress: this.session.playerAddress,
      expiresAt: this.session.expiresAt,
    };
  }

  // Clear session
  logout(): void {
    this.session = null;
  }
}

