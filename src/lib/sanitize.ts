/**
 * Sanitize user input by stripping HTML tags and trimming whitespace.
 */
export function sanitizeInput(str: string): string {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}
