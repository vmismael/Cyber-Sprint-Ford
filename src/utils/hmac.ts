import * as Crypto from 'expo-crypto';

// Simplified keyed-hash using SHA-256(secret + NUL + payload).
// Not RFC 2104 HMAC, but sufficient for payload integrity in this mock context.
const SEP = '\x00';

export async function signPayload(payload: string, secret: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${secret}${SEP}${payload}`,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
}

export async function verifyPayload(
  payload: string,
  sig: string,
  secret: string,
): Promise<boolean> {
  const expected = await signPayload(payload, secret);
  return expected === sig;
}
