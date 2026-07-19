/**
 * Input sanitization and validation utilities for server actions and forms.
 */

// Basic email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone number regex pattern (digits, spaces, +, -, parentheses)
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

/**
 * Strips HTML tags and script injections, trims whitespace, and limits length.
 */
export function sanitizeText(val: any, maxLength = 1000): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  const stripped = str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>?/gm, "")
    .trim();
  return stripped.substring(0, maxLength);
}

/**
 * Validates email address format.
 */
export function validateEmail(email: any): boolean {
  if (!email || typeof email !== "string") return false;
  const sanitized = email.trim();
  return EMAIL_REGEX.test(sanitized) && sanitized.length <= 254;
}

/**
 * Validates phone number format.
 */
export function validatePhone(phone: any): boolean {
  if (!phone || typeof phone !== "string") return false;
  const sanitized = phone.trim();
  return PHONE_REGEX.test(sanitized) && sanitized.length >= 7 && sanitized.length <= 20;
}

/**
 * Validates numeric inputs within min/max bounds.
 */
export function validateNumber(val: any, min = 0, max = 100000000, defaultVal = 0): number {
  const parsed = Number(val);
  if (isNaN(parsed)) return defaultVal;
  return Math.max(min, Math.min(max, parsed));
}

/**
 * Sanitizes all string fields in an object automatically.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result: any = { ...obj };
  for (const key in result) {
    if (typeof result[key] === "string") {
      result[key] = sanitizeText(result[key]);
    }
  }
  return result;
}
