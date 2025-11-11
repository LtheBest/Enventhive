import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'company';
  companyId?: string;
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m', // Short-lived access token
  });
}

export function generateRefreshToken(): string {
  return randomBytes(40).toString('hex');
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function verifyRefreshToken(token: string): boolean {
  // Refresh tokens are stored in DB, verification happens there
  return token.length === 80; // Basic validation
}
