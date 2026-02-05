export interface DashboardMetrics {
  totalPending: number;
  totalSuccess: number;
  totalFailed: number;
  totalDlq: number;
  totalProcessing: number;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  status: string;
  maxAttempts: number;
  timeoutMs: number;
  concurrencyLimit: number;
  createdAt: string;
}

export interface DeliveryJob {
  id: string;
  endpointId: string;
  endpointName: string;
  status: string;
  nextAttemptAt: string;
  attemptCount: number;
  createdAt: string;
}

export interface DeliveryAttempt {
  id: string;
  httpStatus: number;
  durationMs: number;
  success: boolean;
  errorType: string;
  createdAt: string;
}
