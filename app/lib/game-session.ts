// Server-side game session tracking and validation

interface GameAction {
  type: 'shot_fired' | 'enemy_killed' | 'game_started' | 'game_ended';
  timestamp: number;
  data?: Record<string, unknown>;
}

interface GameSession {
  playerAddress: string;
  sessionId: string;
  startTime: number;
  lastAction: number;
  actions: GameAction[];
  score: number;
  enemiesKilled: number;
  shotsFired: number;
  isActive: boolean;
}

// In-memory session storage (use Redis/database in production)
const activeSessions = new Map<string, GameSession>();

// Game validation constants
const GAME_LIMITS = {
  MAX_SHOTS_PER_SECOND: 10, // Maximum shots per second
  MAX_KILLS_PER_SECOND: 5,  // Maximum kills per second
  MIN_TIME_BETWEEN_ACTIONS: 50, // Minimum 50ms between actions
  MAX_SESSION_DURATION: 30 * 60 * 1000, // 30 minutes max session
  POINTS_PER_KILL: 10,
  MAX_SCORE_PER_SESSION: 10000, // Reasonable max score
};

// Clean up expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastAction > GAME_LIMITS.MAX_SESSION_DURATION) {
      activeSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

export function createGameSession(playerAddress: string): string {
  const sessionId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session: GameSession = {
    playerAddress,
    sessionId,
    startTime: Date.now(),
    lastAction: Date.now(),
    actions: [{
      type: 'game_started',
      timestamp: Date.now(),
    }],
    score: 0,
    enemiesKilled: 0,
    shotsFired: 0,
    isActive: true,
  };
  
  activeSessions.set(sessionId, session);
  return sessionId;
}

export function validateGameAction(
  sessionId: string,
  playerAddress: string,
  action: Omit<GameAction, 'timestamp'>
): { valid: boolean; error?: string; session?: GameSession } {
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    return { valid: false, error: 'Invalid session ID' };
  }
  
  if (session.playerAddress !== playerAddress) {
    return { valid: false, error: 'Session belongs to different player' };
  }
  
  if (!session.isActive) {
    return { valid: false, error: 'Game session is not active' };
  }
  
  const now = Date.now();
  
  // Check if session is expired
  if (now - session.startTime > GAME_LIMITS.MAX_SESSION_DURATION) {
    session.isActive = false;
    return { valid: false, error: 'Game session expired' };
  }
  
  // Check minimum time between actions
  if (now - session.lastAction < GAME_LIMITS.MIN_TIME_BETWEEN_ACTIONS) {
    return { valid: false, error: 'Actions too frequent' };
  }
  
  // Validate action-specific rules
  const recentActions = session.actions.filter(a => now - a.timestamp < 1000); // Last second
  
  switch (action.type) {
    case 'shot_fired':
      const recentShots = recentActions.filter(a => a.type === 'shot_fired').length;
      if (recentShots >= GAME_LIMITS.MAX_SHOTS_PER_SECOND) {
        return { valid: false, error: 'Too many shots fired per second' };
      }
      session.shotsFired++;
      break;
      
    case 'enemy_killed':
      const recentKills = recentActions.filter(a => a.type === 'enemy_killed').length;
      if (recentKills >= GAME_LIMITS.MAX_KILLS_PER_SECOND) {
        return { valid: false, error: 'Too many kills per second' };
      }
      session.enemiesKilled++;
      session.score += GAME_LIMITS.POINTS_PER_KILL;
      
      // Check if score is reasonable
      if (session.score > GAME_LIMITS.MAX_SCORE_PER_SESSION) {
        return { valid: false, error: 'Score too high for session duration' };
      }
      break;
      
    case 'game_ended':
      session.isActive = false;
      break;
  }
  
  // Add the action to session
  const timestampedAction: GameAction = {
    ...action,
    timestamp: now,
  };
  
  session.actions.push(timestampedAction);
  session.lastAction = now;
  
  return { valid: true, session };
}

export function getGameSession(sessionId: string): GameSession | null {
  return activeSessions.get(sessionId) || null;
}

export function endGameSession(sessionId: string, playerAddress: string): { 
  valid: boolean; 
  finalScore?: number; 
  error?: string 
} {
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    return { valid: false, error: 'Invalid session ID' };
  }
  
  if (session.playerAddress !== playerAddress) {
    return { valid: false, error: 'Session belongs to different player' };
  }
  
  session.isActive = false;
  
  // Add game ended action
  session.actions.push({
    type: 'game_ended',
    timestamp: Date.now(),
  });
  
  return {
    valid: true,
    finalScore: session.score,
  };
}

export function getSessionStats(sessionId: string): {
  score: number;
  enemiesKilled: number;
  shotsFired: number;
  accuracy: number;
  sessionDuration: number;
} | null {
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  const accuracy = session.shotsFired > 0 ? (session.enemiesKilled / session.shotsFired) * 100 : 0;
  const sessionDuration = Date.now() - session.startTime;
  
  return {
    score: session.score,
    enemiesKilled: session.enemiesKilled,
    shotsFired: session.shotsFired,
    accuracy: Math.round(accuracy * 100) / 100,
    sessionDuration,
  };
}

