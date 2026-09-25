/** Mascaramento de PII para respostas ao analista e para logs (LGPD — minimização). */
export function maskName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => (part.length <= 1 ? part : `${part[0]}${'*'.repeat(Math.min(part.length - 1, 5))}`))
    .join(' ');
}

export function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  const [host = '', ...tld] = domain.split('.');
  const m = (s: string) => (s ? `${s[0]}***` : '***');
  return `${m(local)}@${m(host)}${tld.length ? '.' + tld.join('.') : ''}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length < 4 ? '****' : `(**) *****-${digits.slice(-4)}`;
}
