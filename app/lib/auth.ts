import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { verifyMessage } from 'viem';

// Remove the problematic client-side API secret
const SERVER_API_SECRET = process.env.API_SECRET;

if (!SERVER_API_SECRET) {
  throw new Error('API_SECRET environment variable is required');
}

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate a nonce for signature verification
export function generateNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Store nonces temporarily (in production, use Redis or database)
const activeNonces = new Map<string, { timestamp: number; used: boolean }>();

// Clean up expired nonces every 5 minutes
setInterval(() => {
  const now = Date.now();
  const NONCE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  
  for (const [nonce, data] of activeNonces.entries()) {
    if (now - data.timestamp > NONCE_EXPIRY) {
      activeNonces.delete(nonce);
    }
  }
}, 5 * 60 * 1000);

// Generate and store a nonce
export function createNonce(): string {
  const nonce = generateNonce();
  activeNonces.set(nonce, { timestamp: Date.now(), used: false });
  return nonce;
}

// Verify signature and consume nonce
export async function verifySignatureAndNonce(
  address: string,
  signature: string,
  nonce: string
): Promise<boolean> {
  try {
    // Check if nonce exists and isn't used
    const nonceData = activeNonces.get(nonce);
    if (!nonceData || nonceData.used) {
      return false;
    }

    // Check if nonce is expired (5 minutes)
    const NONCE_EXPIRY = 5 * 60 * 1000;
    if (Date.now() - nonceData.timestamp > NONCE_EXPIRY) {
      activeNonces.delete(nonce);
      return false;
    }

    // Create the message that should have been signed
    const message = `Authenticate wallet for gaming session.\nNonce: ${nonce}\nAddress: ${address}`;

    // Verify the signature
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`
    });

    if (isValid) {
      // Mark nonce as used
      nonceData.used = true;
      return true;
    }

    return false;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Generate a session-based token that includes player address and timestamp
export function generateSessionToken(playerAddress: string, timestamp: number): string {
  const data = `${playerAddress}-${timestamp}-${SERVER_API_SECRET}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Validate session token with player address verification
export function validateSessionToken(token: string, playerAddress: string, timestampWindow: number = 300000): boolean {
  const now = Date.now();
  
  // Check tokens within the timestamp window (default 5 minutes)
  for (let i = 0; i < timestampWindow; i += 30000) { // Check every 30 seconds
    const timestamp = now - i;
    const expectedToken = generateSessionToken(playerAddress, Math.floor(timestamp / 30000) * 30000);
    if (token === expectedToken) {
      return true;
    }
  }
  
  return false;
}

// Legacy API key validation for internal server use only
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return false;
  }

  // Only accept server-side API key
  return apiKey === SERVER_API_SECRET;
}

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const userAgent = request.headers.get('user-agent');
  
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL
  ].filter(Boolean);

  // Stricter origin validation
  if (!origin || !allowedOrigins.includes(origin)) {
    // Also check referer as fallback, but be more strict
    if (!referer || !allowedOrigins.some(allowed => referer.startsWith(allowed + '/'))) {
      return false;
    }
  }

  // Additional check: reject requests that look like automated tools
  if (!userAgent || userAgent.includes('curl') || userAgent.includes('wget') || userAgent.includes('Postman')) {
    return false;
  }

  return true;
}

// CSRF token generation and validation
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(request: NextRequest, expectedToken: string): boolean {
  const token = request.headers.get('x-csrf-token');
  return token === expectedToken;
}

export function createAuthenticatedResponse(data: Record<string, unknown>, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}