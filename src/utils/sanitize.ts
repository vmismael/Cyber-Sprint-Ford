const DANGEROUS_CHARS = /[<>"'`]/g;

export function sanitizeString(value: string): string {
  return value.replace(DANGEROUS_CHARS, '');
}
