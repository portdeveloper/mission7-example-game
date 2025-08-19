import { NextRequest } from 'next/server';
import crypto from 'crypto';

const SERVER_API_SECRET = process.env.API_SECRET;
const CLIENT_API_SECRET = process.env.NEXT_PUBLIC_CLIENT_API_SECRET;

if (!SERVER_API_SECRET || !CLIENT_API_SECRET) {
  throw new Error('API_SECRET and NEXT_PUBLIC_CLIENT_API_SECRET environment variables are required');
}

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return false;
  }

  // Accept either server-side or client-side API key
  return apiKey === SERVER_API_SECRET || apiKey === CLIENT_API_SECRET;
}

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }

  if (referer && allowedOrigins.some(allowed => referer.startsWith(allowed))) {
    return true;
  }

  return false;
}

export function createAuthenticatedResponse(data: any, status = 200) {
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