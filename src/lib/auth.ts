import bcryptjs from 'bcryptjs';

const ROUNDS = 10;

/**
 * Hash a PIN for secure storage
 */
export async function hashPin(pin: string): Promise<string> {
  return bcryptjs.hash(pin, ROUNDS);
}

/**
 * Verify a PIN against a hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(pin, hash);
}

/**
 * Generate a random PIN for testing
 */
export function generateRandomPin(): string {
  return Math.random().toString().slice(2, 7);
}
