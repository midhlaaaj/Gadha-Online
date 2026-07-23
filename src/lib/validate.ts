/**
 * Shared input validation and sanitization utility for Gadha Online.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Basic email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[0-9\s\+\(\)\-\.]{7,20}$/;

/**
 * Strips HTML/script tags from a string to prevent stored XSS.
 */
export function sanitizeText(value: unknown, maxLength = 1000): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return str
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .substring(0, maxLength);
}

/** RFC-5321-like email validation. */
export function validateEmail(value: string): ValidationResult {
  const trimmed = (value || "").trim();
  const isString = typeof value === "string";
  const noBadChars = !/[<>"'\\]/.test(trimmed);
  const isValidPattern = EMAIL_REGEX.test(trimmed) && trimmed.length <= 254;

  const valid = Boolean(isString && trimmed && noBadChars && isValidPattern);
  if (!valid) {
    return {
      valid,
      error: !trimmed
        ? "Email address is required."
        : !noBadChars
        ? "Email contains invalid characters."
        : "Please enter a valid email address.",
    };
  }
  return { valid };
}

/** Name validation */
export function validateName(value: string): ValidationResult {
  const trimmed = (value || "").trim();
  if (!trimmed) return { valid: false, error: "Full name is required." };
  if (trimmed.length < 2) return { valid: false, error: "Name must be at least 2 characters." };
  if (trimmed.length > 80) return { valid: false, error: "Name must be under 80 characters." };
  if (/[<>"&;{}\\]/.test(trimmed)) return { valid: false, error: "Name contains invalid characters." };
  return { valid: true };
}

/** Phone validation */
export function validatePhone(value: string): ValidationResult {
  const trimmed = (value || "").trim();
  const valid = !trimmed || (PHONE_REGEX.test(trimmed) && trimmed.length >= 7 && trimmed.length <= 20);
  if (!valid) {
    return { valid, error: "Phone number must contain only digits, spaces, +, (, ), or -." };
  }
  return { valid };
}

/** Password validation */
export function validatePassword(value: string): ValidationResult {
  if (!value) return { valid: false, error: "Password is required." };
  if (value.length < 8) return { valid: false, error: "Password must be at least 8 characters." };
  if (!/[a-zA-Z]/.test(value)) return { valid: false, error: "Password must contain at least one letter." };
  if (!/[0-9]/.test(value)) return { valid: false, error: "Password must contain at least one number." };
  return { valid: true };
}

/** Free-text message validation */
export function validateMessage(
  value: string,
  { required = true, maxLength = 2000 }: { required?: boolean; maxLength?: number } = {}
): ValidationResult {
  const trimmed = (value || "").trim();
  if (!trimmed && required) return { valid: false, error: "Message cannot be empty." };
  if (trimmed.length > maxLength) {
    return { valid: false, error: `Message must be under ${maxLength} characters.` };
  }
  if (/<script/i.test(trimmed) || /javascript:/i.test(trimmed)) {
    return { valid: false, error: "Message contains disallowed content." };
  }
  return { valid: true };
}

/** Grade validation */
export function validateGrade(value: string): ValidationResult {
  const trimmed = (value || "").trim();
  if (!trimmed) return { valid: false, error: "Grade / class is required." };
  if (trimmed.length > 40) return { valid: false, error: "Grade label must be under 40 characters." };
  if (/[<>"'&;{}\\]/.test(trimmed)) return { valid: false, error: "Grade contains invalid characters." };
  return { valid: true };
}

/** Subject validation */
export function validateSubject(value: string): ValidationResult {
  const trimmed = (value || "").trim();
  if (!trimmed) return { valid: false, error: "Subject is required." };
  if (trimmed.length > 120) return { valid: false, error: "Subject must be under 120 characters." };
  if (/[<>"&;{}\\]/.test(trimmed)) return { valid: false, error: "Subject contains invalid characters." };
  return { valid: true };
}

/** Validates number within min/max bounds */
export function validateNumber(val: unknown, min = 0, max = 100000000, defaultVal = 0): number {
  const parsed = Number(val as string | number);
  if (isNaN(parsed)) return defaultVal;
  return Math.max(min, Math.min(max, parsed));
}

/** Sanitizes all string fields in an object */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    const value = result[key];
    if (typeof value === "string") {
      result[key] = sanitizeText(value) as T[Extract<keyof T, string>];
    }
  }
  return result;
}
