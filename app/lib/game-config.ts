// Game configuration
export const GAME_CONFIG = {
  // Your registered game address
  GAME_ADDRESS: '0x33d8711368801358714dc11d03c1c130ba5ca342',
  
  // Game settings
  SCORE_SUBMISSION: {
    // Submit score every X points
    SCORE_THRESHOLD: 10,
    
    // Track transactions (actions that cost points/tokens)
    TRANSACTION_THRESHOLD: 1,
  },
  
  // Game metadata
  METADATA: {
    name: 'MonDefense',
    url: 'https://mondefense.vercel.app/',
    image: 'https://picsum.photos/536/354'
  }
} as const;