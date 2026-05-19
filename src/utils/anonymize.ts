// João Silva → J*** S***
export function maskName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => (part.length > 0 ? `${part[0]}***` : part))
    .join(' ');
}

// joao@gmail.com → j***@g***.com
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at === -1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  const domainName = dot !== -1 ? domain.slice(0, dot) : domain;
  const tld = dot !== -1 ? domain.slice(dot) : '';
  return `${local[0] ?? ''}***@${domainName[0] ?? ''}***${tld}`;
}
