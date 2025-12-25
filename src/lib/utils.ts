import { randomBytes } from 'crypto';

/**
 * Generate a short, human-friendly pickup code
 * Format: 3 uppercase letters (A-Z)
 * Excludes easily confused characters: O, I, L
 */
export function generatePickupCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // letters only, no O, I, L
  const length = 3;
  let code = '';
  const bytes = randomBytes(length);

  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }

  return code;
}

/**
 * Extract last 4 digits from phone number
 */
export function getPhoneLast4(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-4);
}

/**
 * Format phone for display (mask all but last 4)
 * Input: E.164 format like +15551234567
 * Output: ***-***-1234
 */
export function maskPhoneForDisplay(phoneE164: string): string {
  const last4 = getPhoneLast4(phoneE164);
  return `***-***-${last4}`;
}

/**
 * Convert phone to E.164 format
 * Simple implementation - assumes US numbers
 */
export function normalizePhoneToE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  // Add country code if missing (assume +1 for US)
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // Already formatted or invalid
  return digits.startsWith('+') ? digits : `+${digits}`;
}

/**
 * Check if phone is valid (at least 10 digits)
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
}

/**
 * Get readable display name for a person
 */
export function getPersonName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Format date for display
 */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get event display text
 */
export function getEventDisplay(title: string, startsAt: Date): string {
  const date = new Date(startsAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${title} (${date})`;
}
