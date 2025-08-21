declare namespace NodeJS {
  interface ProcessEnv {
    // Required environment variables
    WALLET_PRIVATE_KEY: string;
    API_SECRET: string;
    NEXT_PUBLIC_PRIVY_APP_ID: string;
    NEXT_PUBLIC_APP_URL: string;
    
    // Optional environment variables
    NEXT_PUBLIC_RPC_URL?: string;
  }
}