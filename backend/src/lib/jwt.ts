import { SignJWT, jwtVerify, errors as joseErrors } from 'jose';
import { randomUUID } from 'node:crypto';
import type { Role } from '../security/rbac';

const ISSUER = 'ford-intelligence-api';
const AUDIENCE = 'ford-intelligence-app';
const ALG = 'HS256';

export type AccessClaims = { sub: string; role: Role; jti: string };

export type JwtVerifyResult =
  | { ok: true; claims: AccessClaims }
  | { ok: false; reason: 'expired' | 'invalid' };

export function createJwtService(secret: string, ttlSeconds: number) {
  const key = new TextEncoder().encode(secret);

  return {
    ttlSeconds,

    async sign(userId: string, role: Role): Promise<string> {
      // O payload leva só o necessário: JWT é codificado, não criptografado.
      return new SignJWT({ role })
        .setProtectedHeader({ alg: ALG, typ: 'JWT' })
        .setSubject(userId)
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setJti(randomUUID())
        .setIssuedAt()
        .setExpirationTime(`${ttlSeconds}s`)
        .sign(key);
    },

    async verify(token: string): Promise<JwtVerifyResult> {
      try {
        const { payload } = await jwtVerify(token, key, {
          algorithms: [ALG], // algoritmo fixo: bloqueia `alg: none` e troca de algoritmo
          issuer: ISSUER,
          audience: AUDIENCE,
          requiredClaims: ['sub', 'exp', 'iat', 'jti'],
        });
        if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string') {
          return { ok: false, reason: 'invalid' };
        }
        return { ok: true, claims: { sub: payload.sub, role: payload.role as Role, jti: payload.jti } };
      } catch (err) {
        if (err instanceof joseErrors.JWTExpired) return { ok: false, reason: 'expired' };
        return { ok: false, reason: 'invalid' };
      }
    },
  };
}
export type JwtService = ReturnType<typeof createJwtService>;
