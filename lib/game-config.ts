// Game configuration
export const GAME_CONFIG = {
  // Monad Games ID Smart Contract Integration
  BLOCKCHAIN: {
    // Monad Games ID smart contract address for UpdatePlayerData()
    MONAD_GAMES_ID_CONTRACT: '0x4b91a6541Cab9B2256EA7E6787c0aa6BE38b39c0',
    
    // Signer wallet address for on-chain transactions
    SIGNER_WALLET: '0x74E4E54Ac02C560B3a9C4149cDB8FEeC87457338',
    
    // Game ID for leaderboard integration
    GAME_ID: '8',
    
    // Leaderboard URL
  LEADERBOARD_URL: 'https://www.monadclip.fun/leaderboard?page=1&gameId=8'
  },
  
  // Game settings
  SCORE_SUBMISSION: {
    // Submit score every X points
    SCORE_THRESHOLD: 10,
    
    // Track transactions (actions that cost points/tokens)
    TRANSACTION_THRESHOLD: 1,
  },
  
  // Game metadata
  METADATA: {
    name: 'Monad Defense',
    url: 'https://mondefense.vercel.app/',
    image: 'https://picsum.photos/536/354'
  }
} as const;