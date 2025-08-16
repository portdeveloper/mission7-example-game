// Game configuration
export const GAME_CONFIG = {
  // Your registered game address
  GAME_ADDRESS: '0xf5ea577f39318dc012d5Cbbf2d447FdD76c48523',
  
  // Game settings
  SCORE_SUBMISSION: {
    // Submit score every X points
    SCORE_THRESHOLD: 10,
    
    // Track transactions (actions that cost points/tokens)
    TRANSACTION_THRESHOLD: 1,
  },
  
  // Game metadata
  METADATA: {
    name: 'Example Game',
    url: 'https://mission7-example-game.vercel.app/',
    image: 'https://picsum.photos/536/354'
  }
} as const;