import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Remove the problematic client-side API secret
const SERVER_API_SECRET = process.env.API_SECRET;

if (!SERVER_API_SECRET) {
  throw new Error('API_SECRET environment variable is required');
}

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
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