import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

/**
 * Criptografia de campo com AES-256-GCM, para dados pessoais guardados no banco
 * (ex.: endereço de coleta do "leva e traz"). GCM também detecta adulteração.
 * Formato armazenado: v1.<iv>.<authTag>.<cifra>
 */
export function createFieldCipher(base64Key: string) {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== 32) throw new Error('Chave de criptografia inválida');

  return {
    encrypt(plain: string): string {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      return ['v1', iv.toString('base64url'), tag.toString('base64url'), data.toString('base64url')].join('.');
    },
    decrypt(payload: string): string {
      const [version, iv, tag, data] = payload.split('.');
      if (version !== 'v1' || !iv || !tag || !data) throw new Error('Payload cifrado inválido');
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));
      return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
    },
  };
}
export type FieldCipher = ReturnType<typeof createFieldCipher>;

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export const hmacSha256 = (value: string, secret: string) =>
  createHmac('sha256', secret).update(value).digest('hex');

/** Token opaco (refresh token): 32 bytes aleatórios. Só o hash vai para o banco. */
export const randomToken = () => randomBytes(32).toString('base64url');

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
