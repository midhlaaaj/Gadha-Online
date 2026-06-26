/**
 * Shared input validation utility for Tutoboard.
 *
 * Why this matters:
 *  - Supabase uses parameterized payloads, so classic SQL injection is not
 *    possible via the JS client. These validators protect against:
 *    • XSS (stored script injection via text fields)
 *    • Data integrity (only well-formed values reach the database)
 *    • Defense in depth (multiple layers, regardless of backend safety)
 *
 * All functions return { valid: boolean; error?: string }.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ─── Sanitiser ────────────────────────────────────────────────────────────────

/**
 * Strips HTML/script tags from a string to prevent stored XSS.
 * Does NOT encode — use this before storing or displaying raw text.
 */
export function sanitizeText(value: string): string {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

// ─── Validators ───────────────────────────────────────────────────────────────

/** RFC-5321-like email validation. */
export function validateEmail(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, error: "Email address is required." };
  // Disallow angle brackets, quotes, backslashes — common injection vectors
  if (/[<>"'\\]/.test(trimmed))
    return { valid: false, error: "Email contains invalid characters." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed))
    return { valid: false, error: "Please enter a valid email address." };
  if (trimmed.length > 254)
    return { valid: false, error: "Email address is too long." };
  return { valid: true };
}

/**
 * Name validation — allows letters (incl. Unicode), spaces, hyphens,
 * apostrophes. Blocks HTML/script characters.
 */
export function validateName(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, error: "Full name is required." };
  if (trimmed.length < 2)
    return { valid: false, error: "Name must be at least 2 characters." };
  if (trimmed.length > 80)
    return { valid: false, error: "Name must be under 80 characters." };
  // Block angle brackets, script injection characters
  if (/[<>"&;{}\\]/.test(trimmed))
    return { valid: false, error: "Name contains invalid characters." };
  return { valid: true };
}

/**
 * Phone validation — optional field. If provided, allows digits, spaces,
 * +, (, ), -, . only.
 */
export function validatePhone(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: true }; // optional
  if (!/^[0-9\s\+\(\)\-\.]{7,20}$/.test(trimmed))
    return {
      valid: false,
      error: "Phone number must contain only digits, spaces, +, (, ), or -.",
    };
  return { valid: true };
}

/**
 * Password validation — min 8 chars, must contain at least one letter
 * and one digit.
 */
export function validatePassword(value: string): ValidationResult {
  if (!value) return { valid: false, error: "Password is required." };
  if (value.length < 8)
    return { valid: false, error: "Password must be at least 8 characters." };
  if (!/[a-zA-Z]/.test(value))
    return { valid: false, error: "Password must contain at least one letter." };
  if (!/[0-9]/.test(value))
    return { valid: false, error: "Password must contain at least one number." };
  return { valid: true };
}

/**
 * Free-text message / subject validation.
 * Strips script tags and enforces a max length.
 */
export function validateMessage(
  value: string,
  { required = true, maxLength = 2000 }: { required?: boolean; maxLength?: number } = {}
): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed && required)
    return { valid: false, error: "Message cannot be empty." };
  if (trimmed.length > maxLength)
    return {
      valid: false,
      error: `Message must be under ${maxLength} characters (currently ${trimmed.length}).`,
    };
  // Block obvious script injection patterns
  if (/<script/i.test(trimmed) || /javascript:/i.test(trimmed))
    return { valid: false, error: "Message contains disallowed content." };
  return { valid: true };
}

/**
 * Grade/class label — alphanumeric, spaces, hyphens. E.g. "Grade 5", "10-A".
 */
export function validateGrade(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, error: "Grade / class is required." };
  if (trimmed.length > 40)
    return { valid: false, error: "Grade label must be under 40 characters." };
  if (/[<>"'&;{}\\]/.test(trimmed))
    return { valid: false, error: "Grade contains invalid characters." };
  return { valid: true };
}

/**
 * Short subject / title field — non-empty, max 120 chars, no HTML.
 */
export function validateSubject(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, error: "Subject is required." };
  if (trimmed.length > 120)
    return { valid: false, error: "Subject must be under 120 characters." };
  if (/[<>"&;{}\\]/.test(trimmed))
    return { valid: false, error: "Subject contains invalid characters." };
  return { valid: true };
}
