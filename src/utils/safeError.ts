const GENERIC = 'Algo deu errado. Tente novamente.';

// Only surface messages that were explicitly written for the user.
// Everything else (stack traces, library names, internal errors) becomes generic.
const ALLOWLIST = new Set([
  'Credenciais inválidas.',
  'Falha ao entrar. Tente novamente.',
  'Falha ao criar conta.',
  'Email não encontrado.',
  'Conta já existe.',
]);

export function toSafeMessage(err: unknown): string {
  if (err instanceof Error && ALLOWLIST.has(err.message)) {
    return err.message;
  }
  return GENERIC;
}
