// Game configuration
export const GAME_CONFIG = {
  // Monad Games ID Smart Contract Integration
  BLOCKCHAIN: {
    // Monad Games ID smart contract address for UpdatePlayerData()
    MONAD_GAMES_ID_CONTRACT: '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4',
    
    // Signer wallet address for on-chain transactions
    SIGNER_WALLET: '0xD138925168aD03fEe0Cca73cD949F1077C82c093',
    
    // Game ID for leaderboard integration
    GAME_ID: '230',
    
    // Leaderboard URL
    LEADERBOARD_URL: 'https://monad-games-id-site.vercel.app/leaderboard?page=1&gameId=230'
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