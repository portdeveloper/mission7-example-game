declare namespace NodeJS {
  interface ProcessEnv {
    WALLET_PRIVATE_KEY: string;
    NEXT_PUBLIC_RPC_URL?: string;
  }
}