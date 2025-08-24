// Database-related types and interfaces

export interface User {
  id: string;
  username: string;
  password: string;
  wallet_id: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  createdAt: Date;
}

export interface CryptoBalance {
  symbol: string;
  balance: string;
}

export interface TransactionInput {
  walletId: string;
  symbol: string;
  amount: string;
  type: 'deposit' | 'withdraw';
}

export interface LoginSuccessEvent {
  email: string;
  timestamp: string;
}

export const RedisKey = {
  user: (userId: string) => `user:${userId}`,
  wallet: (walletId: string) => `wallet:${walletId}`,
  usersByUsername: () => 'users:by-username',
  cryptoBalances: (walletId: string) => `wallet:${walletId}:cryptos`,
  transaction: (transactionId: string) => `transaction:${transactionId}`,
  transactionsByWallet: (walletId: string) => `wallet:${walletId}:transactions`,
} as const;

export const RedisChannel = {
  AUTH_LOGIN_SUCCESS: 'auth:login:success',
  DEPOSIT_SUCCESS: 'deposit:success',
  DEPOSIT_FAILED: 'deposit:failed',
  WITHDRAW_SUCCESS: 'withdraw:success',
  WITHDRAW_FAILED: 'withdraw:failed',
} as const;
