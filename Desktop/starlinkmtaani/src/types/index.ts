export interface DataPackage {
  id: string;
  price: number;
  label: string;
  durationText: string;
  durationHours: number;
}

export type TransactionStatus = 'idle' | 'awaiting_pin' | 'pending' | 'confirmed' | 'failed' | 'timeout';

export interface Transaction {
  id: string;
  packageId: string;
  phone: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  mpesaReceipt?: string;
  reason?: string;
}

export interface SessionInfo {
  ipAddress: string;
  bytesUp: number;
  bytesDown: number;
  connectedSeconds: number;
  secondsRemaining: number;
  packageLabel: string;
}

export type Screen = 'checking' | 'active' | 'plans' | 'payment' | 'pending' | 'connected' | 'tv' | 'dashboard';

export interface ActiveSession {
  transactionId: string;
  packageLabel: string;
  expiresInText: string;
}

// -- API errors ---------------------------------------------------------

export type ApiErrorCode =
  | 'SUBSCRIPTION_REQUIRED'
  | 'INVALID_MAC'
  | 'SAME_DEVICE'
  | 'TV_IN_USE'
  | 'TV_LIMIT_REACHED'
  | 'TRIAL_ALREADY_USED'
  | 'NOT_ELIGIBLE'
  | 'DEVICE_UNKNOWN'
  | 'ACTIVATION_FAILED'
  | 'REVOKE_FAILED'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

/** Adds the browser/server clock difference so countdowns follow the SERVER clock. */
export type WithSkew<T> = T & { skewMs: number };

// -- subscription + free trial --------------------------------------------

export type SubscriptionState = 'active' | 'expired' | 'inactive';

export interface SubscriptionSummary {
  status: SubscriptionState;
  packageLabel: string | null;
  expiresAt: string | null;
  secondsRemaining: number;
  transactionId: string | null;
}

export type TrialState = 'available' | 'activating' | 'active' | 'expired' | 'ineligible';

export interface TrialStatus {
  status: TrialState;
  eligible: boolean;
  durationSeconds: number;
  serverTime: string;
  startedAt?: string | null;
  expiresAt?: string | null;
  secondsRemaining: number;
  reason?: string;
  alreadyActive?: boolean;
}

// -- connect TV -----------------------------------------------------------

export type TvConnectionState = 'connecting' | 'connected' | 'expired' | 'failed';

export interface TvConnection {
  id: string;
  name: string;
  tvMac: string;
  status: TvConnectionState;
  connectedAt: string | null;
  expiresAt: string | null;
}

export interface TvOverview {
  serverTime: string;
  subscription: SubscriptionSummary;
  tvs: TvConnection[];
  tvLimit: number;
  canConnect: boolean;
  alreadyConnected?: boolean;
}

export interface TvConnectRequest {
  tvMac: string;
  name?: string;
}

// -- spending dashboard -----------------------------------------------------

export interface SpendingPayment {
  id: string;
  packageLabel: string;
  amount: number;
  paidAt: string;
  receipt: string | null;
}

export interface SpendingSummary {
  serverTime: string;
  currency: string;
  totals: {
    lifetime: number;
    thisMonth: number;
    last30Days: number;
    purchaseCount: number;
    averagePurchase: number;
  };
  hoursPurchased: number;
  costPerHour: number;
  topPackage: string | null;
  monthly: { month: string; total: number }[];
  payments: SpendingPayment[];
  subscription: SubscriptionSummary;
  freeTrialUsed: boolean;
  pendingOrFailedCount: number;
  sessionsCount: number;
}
