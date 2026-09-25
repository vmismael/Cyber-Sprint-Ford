import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createFieldCipher } from '../src/lib/crypto.js';

const cipher = createFieldCipher(randomBytes(32).toString('base64'));
const plain = 'Rua das Flores, 123 - São Paulo';

// Troca uma das partes de v1.<iv>.<tag>.<cifra> mantendo o resto válido.
function withPart(payload: string, index: 1 | 2 | 3, transform: (buf: Buffer) => Buffer): string {
  const parts = payload.split('.');
  parts[index] = transform(Buffer.from(parts[index]!, 'base64url')).toString('base64url');
  return parts.join('.');
}

describe('Cifra de campo — AES-256-GCM', () => {
  it('decifra o que cifrou, com IV novo a cada chamada', () => {
    const a = cipher.encrypt(plain);
    const b = cipher.encrypt(plain);
    expect(a).not.toBe(b);
    expect(cipher.decrypt(a)).toBe(plain);
  });

  it('recusa tag de autenticação truncada (gcm-no-tag-length)', () => {
    const payload = cipher.encrypt(plain);
    for (const size of [4, 8, 12]) {
      expect(() => cipher.decrypt(withPart(payload, 2, (tag) => tag.subarray(0, size)))).toThrow();
    }
  });

  it('recusa cifra adulterada', () => {
    const payload = cipher.encrypt(plain);
    const tampered = withPart(payload, 3, (data) => {
      const copy = Buffer.from(data);
      copy[0] = copy[0]! ^ 0xff;
      return copy;
    });
    expect(() => cipher.decrypt(tampered)).toThrow();
  });

  it('recusa payload cifrado com outra chave', () => {
    const other = createFieldCipher(randomBytes(32).toString('base64'));
    expect(() => cipher.decrypt(other.encrypt(plain))).toThrow();
  });
});
