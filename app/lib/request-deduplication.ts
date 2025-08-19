import crypto from 'crypto';

interface DeduplicationEntry {
  timestamp: number;
  processing: boolean;
}

const requestCache = new Map<string, DeduplicationEntry>();
const DEDUP_WINDOW_MS = 30000; // 30 seconds
const MAX_PROCESSING_TIME_MS = 60000; // 1 minute

export function generateRequestId(playerAddress: string, scoreAmount: number, transactionAmount: number): string {
  const data = `${playerAddress}-${scoreAmount}-${transactionAmount}-${Math.floor(Date.now() / DEDUP_WINDOW_MS)}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function isDuplicateRequest(requestId: string): boolean {
  const now = Date.now();
  const entry = requestCache.get(requestId);

  if (!entry) {
    return false;
  }

  if (now - entry.timestamp > DEDUP_WINDOW_MS && !entry.processing) {
    requestCache.delete(requestId);
    return false;
  }

  return true;
}

export function markRequestProcessing(requestId: string): void {
  requestCache.set(requestId, {
    timestamp: Date.now(),
    processing: true
  });
}

export function markRequestComplete(requestId: string): void {
  const entry = requestCache.get(requestId);
  if (entry) {
    entry.processing = false;
  }
}

export function cleanupExpiredRequests(): void {
  const now = Date.now();
  for (const [requestId, entry] of requestCache.entries()) {
    const isExpired = now - entry.timestamp > DEDUP_WINDOW_MS;
    const isStuck = entry.processing && now - entry.timestamp > MAX_PROCESSING_TIME_MS;
    
    if (isExpired || isStuck) {
      requestCache.delete(requestId);
    }
  }
}

setInterval(cleanupExpiredRequests, 30000);